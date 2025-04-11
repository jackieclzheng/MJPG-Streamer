document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // 发送登录请求到后端API
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('登录失败');
        }
    })
    .then(data => {
        // 登录成功，保存token
        if (data.token) {
            localStorage.setItem('auth_token', data.token);
            if (rememberMe) {
                localStorage.setItem('remember_me', 'true');
            } else {
                localStorage.removeItem('remember_me');
            }
            // 跳转到主页
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        // 显示错误信息
        document.getElementById('errorMessage').style.display = 'block';
        console.error('登录错误:', error);
    });
});
