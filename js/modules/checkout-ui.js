// Inicializa o formulário de endereço no checkout
function setupCheckoutAddress() {
    const cepInput = document.getElementById('shipping-cep');
    const fetchBtn = document.getElementById('fetch-address');
    const streetInput = document.getElementById('shipping-street');
    const numberInput = document.getElementById('shipping-number');
    const complementInput = document.getElementById('shipping-complement');
    const neighborhoodInput = document.getElementById('shipping-neighborhood');
    const cityInput = document.getElementById('shipping-city');
    const stateInput = document.getElementById('shipping-state');

    if (!cepInput || !fetchBtn) return;

    // Carrega endereço salvo, se existir
    const savedAddress = getShippingAddress();
    if (savedAddress) {
        cepInput.value = savedAddress.cep;
        streetInput.value = savedAddress.street;
        neighborhoodInput.value = savedAddress.neighborhood;
        cityInput.value = savedAddress.city;
        stateInput.value = savedAddress.state;
    }

    // Formata o CEP enquanto digita
    cepInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
        }
        e.target.value = value;
    });

    // Busca endereço quando clicar no botão
    fetchBtn.addEventListener('click', async () => {
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            alert('CEP inválido. Digite um CEP válido.');
            return;
        }

        try {
            fetchBtn.disabled = true;
            fetchBtn.textContent = 'Buscando...';
            
            const address = await fetchAddressByCEP(cep);
            
            // Preenche os campos
            streetInput.value = address.street;
            neighborhoodInput.value = address.neighborhood;
            cityInput.value = address.city;
            stateInput.value = address.state;

            // Salva o endereço
            saveShippingAddress({
                ...address,
                number: numberInput.value,
                complement: complementInput.value
            });

        } catch (error) {
            alert(error.message);
        } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = 'Buscar';
        }
    });

    // Atualiza o endereço salvo quando os campos opcionais mudarem
    [numberInput, complementInput].forEach(input => {
        input.addEventListener('change', () => {
            const savedAddress = getShippingAddress();
            if (savedAddress) {
                saveShippingAddress({
                    ...savedAddress,
                    number: numberInput.value,
                    complement: complementInput.value
                });
            }
        });
    });
}