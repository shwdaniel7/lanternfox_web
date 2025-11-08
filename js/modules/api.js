import { supabase } from '../config/supabaseClient.js';

export async function fetchAllProducts(searchTerm = '', category = 'all') {
    let query = supabase.from('produtos_loja').select('*');

    // Filtro por nome (busca textual)
    if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`);
    }

    // Filtro por categoria
    if (category && category !== 'all') {
        query = query.eq('categoria', category);
    }

    return await query.order('created_at', { ascending: false });
}


export async function fetchProductById(id) {
    return await supabase.from('produtos_loja').select('*').eq('id', id).single();
}

export async function fetchUserOrders(userId) {
    return await supabase
        .from('pedidos')
        .select(`
            *,
            itens_pedido (
                *,
                produtos_loja ( nome, imagem_url ),
                anuncios_usuarios ( titulo, imagem_url )
            )
        `)
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });
}

export async function createOrder(userId, cart) {
    const subtotal = cart.items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + (price * quantity);
    }, 0);
    
    let valor_total = subtotal;
    if (cart.tradeIn) {
        const discount = Number(cart.tradeIn.discount) || 0;
        valor_total -= discount;
    }

    if (valor_total < 0) {
        valor_total = 0;
    }

    if (isNaN(valor_total)) {
        throw new Error('Valor total inválido (NaN).');
    }

    const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({ usuario_id: userId, valor_total: valor_total })
        .select().single();

    if (pedidoError) throw pedidoError;

    const pedido_id = pedidoData.id;
    const itensParaInserir = cart.items.map(item => ({
        pedido_id: pedido_id,
        produto_loja_id: item.type === 'loja' ? item.id : null,
        anuncio_usuario_id: item.type === 'marketplace' ? item.id : null,
        quantidade: item.quantity,
        preco_unitario: item.price
    }));

    const { error: itensError } = await supabase.from('itens_pedido').insert(itensParaInserir);

    if (itensError) throw itensError;

    return pedidoData;
}

export async function fetchAdById(id) {
    return await supabase
        .from('anuncios_usuarios')
        .select('*, profiles(full_name)') // Pega os detalhes do anúncio e o nome do vendedor
        .eq('id', id)
        .single();
}

export async function fetchProductsByIds(ids) {
    return await supabase.from('produtos_loja').select('*').in('id', ids);
}


// Função de diagnóstico para verificar o estado da conexão
async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('anuncios_usuarios').select('count', { count: 'exact' });
        if (error) {
            console.error('Erro de conexão com Supabase:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Erro ao verificar conexão:', e);
        return false;
    }
}

export async function fetchAllUserAds(searchTerm = '', category = 'all') {
    // Verifica a conexão antes de fazer a consulta
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
        // Se a conexão falhar, tenta reconectar
        await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo
        if (!(await checkSupabaseConnection())) {
            throw new Error('Não foi possível estabelecer conexão com o banco de dados');
        }
    }

    let query = supabase.from('anuncios_usuarios').select('*, profiles ( full_name )');

    // Filtro por nome (busca textual)
    if (searchTerm) {
        query = query.ilike('titulo', `%${searchTerm}%`);
    }

    // Filtro por categoria
    if (category && category !== 'all') {
        query = query.eq('categoria', category);
    }

    const { data, error } = await query
        .eq('status', 'disponivel')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar anúncios:', error);
        throw error;
    }

    return { data, error };
}

export async function fetchMyAds(userId) {
    return await supabase
        .from('anuncios_usuarios')
        .select('*')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });
}

// Função para criar um novo anúncio, incluindo o upload da imagem
export async function createAd(userId, adData, imageFile) {
    let imageUrl = null;

    // 1. Se um arquivo de imagem foi fornecido, faz o upload
    if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('imagens_anuncios') // Nome do nosso bucket
            .upload(filePath, imageFile);

        if (uploadError) {
            console.error('Erro no upload da imagem:', uploadError);
            throw new Error('Falha ao enviar a imagem.');
        }

        // 2. Pega a URL pública da imagem que acabamos de enviar
        const { data } = supabase.storage
            .from('imagens_anuncios')
            .getPublicUrl(filePath);
        
        imageUrl = data.publicUrl;
    }

    // 3. Prepara os dados para inserir na tabela
    const adToInsert = {
        usuario_id: userId,
        titulo: adData.titulo,
        descricao: adData.descricao,
        preco_sugerido: adData.preco,
        imagem_url: imageUrl, // Usa a URL do upload (ou null se não houver imagem)
    };

    // 4. Insere o anúncio na tabela 'anuncios_usuarios'
    const { data: newAd, error: insertError } = await supabase
        .from('anuncios_usuarios')
        .insert(adToInsert)
        .select()
        .single();

    if (insertError) {
        console.error('Erro ao criar anúncio:', insertError);
        throw new Error('Falha ao salvar o anúncio.');
    }

    return newAd;
}

// Cria um novo registro na tabela 'trocas'
export async function createTradeProposal(userId, storeProductId, userAdId) {
    return await supabase
        .from('trocas')
        .insert({
            usuario_id: userId,
            produto_loja_id: storeProductId,
            anuncio_usuario_id: userAdId,
        });
}

export async function updateAdStatus(adId, newStatus) {
    return await supabase
        .from('anuncios_usuarios')
        .update({ status: newStatus })
        .eq('id', adId);
}

export async function fetchAdsByIds(ids) {
    return await supabase.from('anuncios_usuarios').select('*').in('id', ids);
}

// Busca o perfil do usuário logado
export async function getProfile(userId) {
    return await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
}

// Atualiza o perfil do usuário
export async function updateProfile(userId, updates, avatarFile) {
    // 1. Se um arquivo de avatar foi enviado, faz o upload primeiro
    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split('.').pop();
        // Cria um caminho único para o arquivo, ex: 'pasta_do_usuario/avatar.png'
        const filePath = `${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatares') // Nome do nosso novo bucket
            .upload(filePath, avatarFile, { upsert: true }); // 'upsert: true' sobrescreve o avatar antigo

        if (uploadError) {
            console.error('Erro no upload do avatar:', uploadError);
            throw new Error('Falha ao enviar o novo avatar.');
        }

        // Pega a URL pública e a adiciona aos 'updates'
        const { data } = supabase.storage
            .from('avatares')
            .getPublicUrl(filePath);
        
        // Adiciona um timestamp para evitar problemas de cache do navegador
        updates.avatar_url = `${data.publicUrl}?t=${new Date().getTime()}`;
    }

    // 2. Atualiza a tabela 'profiles' com o nome e a nova URL do avatar
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
    
    if (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
    }
}

export function renderProfilePage(profile, user) {
    // Elementos de visualização
    const avatarImg = document.getElementById('profile-avatar-img');
    const nameDisplay = document.getElementById('profile-name-display');
    const emailDisplay = document.getElementById('profile-email-display');
    
    // Campos do formulário
    const nameInput = document.getElementById('profile-name-input');
    const avatarInput = document.getElementById('profile-avatar-input');

    if (avatarImg) avatarImg.src = profile.avatar_url || 'https://via.placeholder.com/150';
    if (nameDisplay) nameDisplay.textContent = profile.full_name || 'Nome não definido';
    if (emailDisplay) emailDisplay.textContent = user.email;

    if (nameInput) nameInput.value = profile.full_name || '';
    if (avatarInput) avatarInput.value = profile.avatar_url || '';
}

export async function fetchNewestProducts(limit = 4) {
    return await supabase
        .from('produtos_loja')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
}

export async function fetchPromotionalProducts() {
    return await supabase
        .from('produtos_loja')
        .select('*')
        .eq('em_promocao', true)
        .order('created_at', { ascending: false });
}
