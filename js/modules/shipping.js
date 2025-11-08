// Função para validar formato do CEP
function isValidCEP(cep) {
    return /^[0-9]{8}$/.test(cep.replace(/\D/g, ''));
}

// Função para formatar CEP (12345678 -> 12345-678)
function formatCEP(cep) {
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

// Função para buscar endereço pelo CEP usando a API ViaCEP
export async function fetchAddressByCEP(cep) {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (!isValidCEP(cleanCEP)) {
        throw new Error('CEP inválido');
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();

        if (data.erro) {
            throw new Error('CEP não encontrado');
        }

        return {
            cep: formatCEP(data.cep),
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
        };
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        throw new Error('Erro ao buscar endereço');
    }
}

// Função para calcular o valor do frete
// Usando uma simulação simplificada baseada na distância por estado
export function calculateShipping(destinationCEP, productPrice) {
    // Extrair os dois primeiros dígitos do CEP que identificam a região/estado
    const region = destinationCEP.substring(0, 2);
    
    // Base do frete é 5% do valor do produto
    let baseShipping = productPrice * 0.05;
    
    // Adiciona valor por região
    const regionalMultipliers = {
        // São Paulo
        '01': 1.0, '02': 1.0, '03': 1.0, '04': 1.0, '05': 1.0, '06': 1.0, '07': 1.0, '08': 1.0, '09': 1.0,
        // Rio de Janeiro
        '20': 1.2, '21': 1.2, '22': 1.2, '23': 1.2, '24': 1.2, '25': 1.2, '26': 1.2, '27': 1.2, '28': 1.2,
        // Minas Gerais
        '30': 1.3, '31': 1.3, '32': 1.3, '33': 1.3, '34': 1.3, '35': 1.3, '36': 1.3, '37': 1.3, '38': 1.3, '39': 1.3,
        // Outros estados (multiplica por 1.5)
        'default': 1.5
    };

    const multiplier = regionalMultipliers[region] || regionalMultipliers.default;
    const shippingCost = baseShipping * multiplier;

    // Calcula o prazo com base no multiplicador (quanto maior o multiplicador, mais longe e mais dias)
    const deliveryDays = Math.round(3 + (multiplier * 2));

    return {
        cost: Math.round(shippingCost * 100) / 100, // Arredonda para 2 casas decimais
        days: deliveryDays,
        service: 'PAC' // Poderia ter outras opções como SEDEX
    };
}

// Função para salvar endereço no localStorage
export function saveShippingAddress(address) {
    localStorage.setItem('shippingAddress', JSON.stringify(address));
}

// Função para recuperar endereço do localStorage
export function getShippingAddress() {
    const saved = localStorage.getItem('shippingAddress');
    return saved ? JSON.parse(saved) : null;
}