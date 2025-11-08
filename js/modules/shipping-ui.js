// Inicializa a calculadora de frete na página do produto
function setupShippingCalculator(product) {
    const calculateBtn = document.getElementById('calculate-shipping');
    const cepInput = document.getElementById('shipping-cep');
    const resultDiv = document.getElementById('shipping-result');

    if (!calculateBtn || !cepInput) return;

    // Formata o CEP enquanto digita
    cepInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
        }
        e.target.value = value;
    });

    // Calcula o frete quando clicar no botão
    calculateBtn.addEventListener('click', async () => {
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            resultDiv.innerHTML = '<p style="color: var(--error-color);">CEP inválido. Digite um CEP válido.</p>';
            resultDiv.style.display = 'block';
            return;
        }

        try {
            calculateBtn.disabled = true;
            calculateBtn.textContent = 'Calculando...';
            
            // Busca o endereço primeiro
            const address = await fetchAddressByCEP(cep);
            
            // Calcula o frete
            const shipping = calculateShipping(cep, product.preco);

            // Mostra o resultado
            resultDiv.innerHTML = `
                <div class="shipping-option">
                    <div>
                        <div class="service-name">${shipping.service}</div>
                        <div class="delivery-time">Entrega em até ${shipping.days} dias úteis</div>
                    </div>
                    <div class="price">R$ ${shipping.cost.toFixed(2)}</div>
                </div>
            `;
            resultDiv.style.display = 'block';

            // Salva o endereço para usar no checkout
            saveShippingAddress({ ...address, shipping });

        } catch (error) {
            resultDiv.innerHTML = `<p style="color: var(--error-color);">${error.message}</p>`;
            resultDiv.style.display = 'block';
        } finally {
            calculateBtn.disabled = false;
            calculateBtn.textContent = 'Calcular';
        }
    });

    // Permite calcular apertando Enter
    cepInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateBtn.click();
        }
    });
}