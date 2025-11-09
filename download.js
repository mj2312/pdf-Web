// ダウンロードボタンのクリックイベント
document.getElementById('downloadBtn').addEventListener('click', function() {
  var s3Presigned = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: "presigned---url" },
    region: "ap-northeast-1"
  });
  
  s3Presigned.getObject({
    Bucket: 'presigned---url',
    Key: 'url.json'
  }, function(err, data) {
    if (err) {
      alert('変換が完了していません');
    } else {
        const jsonData = JSON.parse(data.Body.toString('utf-8'));
        if (jsonData.url) {
          window.location.href = jsonData.url;
        } else {
          alert('URLが見つかりません');
        }
    }
  });
});