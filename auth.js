// ユーザー認証所法
const CORRECT_USER = {
  id: ENV.ID,
  password: ENV.PASSWORD
};

// 認証ボタンのイベント
document.querySelector('.header-right button').addEventListener('click', function() {
  // ID,パスワードを取得
  const inputId = document.getElementById('id').value;
  const inputPassword = document.getElementById('password').value;
  
  // 認証成功→全ボタンを有効化
  if (inputId === CORRECT_USER.id && inputPassword === CORRECT_USER.password) {
    document.getElementById('upload-to-s3').disabled = false;
    document.getElementById('jpg-upload').disabled = false;
    document.getElementById('upload-trigger').disabled = false;
    document.getElementById('downloadBtn').disabled = false;
    alert('認証成功');
  } else {
    alert('IDまたはパスワードが違います');
  }
});
