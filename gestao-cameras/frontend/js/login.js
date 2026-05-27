// frontend/js/login.js

document.getElementById('loginForm').addEventListener('submit', function(event) {
    // Impede a página de recarregar ao enviar o formulário
    event.preventDefault();

    // Captura os valores digitados pelo usuário limpando espaços extras
    const usuarioDigitado = document.getElementById('username').value.trim();
    const senhaDigitada = document.getElementById('password').value;
    const mensagemErro = document.getElementById('errorMessage');

    // Credenciais padrões para o acesso administrativo
    const USUARIO_CORRETO = "admin";
    const SENHA_CORRETA = "123456";

    // Validação de credenciais
    if (usuarioDigitado === USUARIO_CORRETO && senhaDigitada === SENHA_CORRETA) {
        // Esconde a mensagem de erro caso ela esteja visível
        mensagemErro.classList.add('hidden');
        
        // VINCULAÇÃO DE SEGURANÇA: Salva o estado de logado no navegador
        localStorage.setItem('isLogged', 'true');
        
        // Redireciona o usuário para a tela de gerenciamento de câmeras
        window.location.href = 'dashboard.html'; 
    } else {
        // Exibe o alerta vermelho na tela caso as credenciais estejam erradas
        mensagemErro.classList.remove('hidden');
        
        // Limpa apenas o campo de senha por conveniência e segurança
        document.getElementById('password').value = "";
    }
});