// AWS S3の情報
var albumBucketName = "jpg-to-pdf";
var bucketRegion = "ap-northeast-1";
var IdentityPoolId = ENV.IDENTITY_POOL_ID;

// SDKの初期化
AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId,
  }),
});

// 古い認証情報をクリア
// (いらない可能性有)
AWS.config.credentials.clearCachedId();

// ページ読み込み時にjpg_files内の画像ファイル、url.jsonを削除
AWS.config.credentials.get(function(err) {
  if (err) {
    console.error("認証エラー:", err);
    return;
  }
  
  var s3Presigned = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: "presigned---url" },
  });
  
  s3Presigned.deleteObject({
    Bucket: 'presigned---url',
    Key: 'url.json'
  }, function(err, data) {
    if (err) {
      console.error("削除エラー:", err);
    } else {
      console.log("json削除完了");
    }
  });
  
  var s3JpgFiles = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: albumBucketName },
  });
  
  s3JpgFiles.listObjects({
    Bucket: albumBucketName,
    Prefix: 'jpg_files/'
  }, function(err, data) {
    if (err) {
      console.error("リストエラー:", err);
      return;
    }
    
    // jpg_filesフォルダを除外
    var filesToDelete = data.Contents.filter(function(object) {
      return object.Key !== 'jpg_files/';
    });
    
    var objectsToDelete = filesToDelete.map(function(object) {
      return { Key: object.Key };
    });
    
    // ファイルを削除
    s3JpgFiles.deleteObjects({
      Bucket: albumBucketName,
      Delete: { Objects: objectsToDelete }
    }, function(err, data) {
      if (err) {
        console.error("削除エラー:", err);
      } else {
        console.log("削除レスポンス全体:", data);
        console.log("jpg_files内のファイル削除完了:", data.Deleted);
      }
    });
  });
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName },
});

// アップロードボタンのクリックイベント
document.getElementById('upload-to-s3').addEventListener('click', function(e) {
  var jpgFiles = document.getElementById("jpg-upload").files;
  for(let i = 0; i < jpgFiles.length; i++) {
    uploadFile(jpgFiles[i], 'jpg_files');
  }
});

// ファイルをS3にアップロード
function uploadFile(file, albumName){
  if (!file) {
    return alert("Please choose a file to upload first.");
  }
  var fileName = file.name;
  var albumPhotosKey = encodeURIComponent(albumName) + "/";

  var photoKey = albumPhotosKey + fileName;

  var upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: albumBucketName,
      Key: photoKey,
      Body: file,
    },
  });

  var promise = upload.promise();

  promise.then(
    function (data) {
      alert("画像をアップロードしました");
    },
    function (err) {
      return alert("エラー", err);
    }
  );
}

// 変換ボタンのクリックイベント
document.getElementById('upload-trigger').addEventListener('click', function(e) {
  // トリガー用のテキストファイルを作成
  var txtContent = "trigger";
  var txtBlob = new Blob([txtContent], { type: 'text/plain' });

  // trigger.txtをアップロード(txtファイルをlambda関数のトリガーにしている)
  var upload = new AWS.S3.ManagedUpload({
    params: {
      Bucket: albumBucketName,
      Key: "jpg_files/trigger.txt",
      Body: txtBlob,
    },
  });

  upload.promise().then(
    function (data) {
      alert("変換します");
    },
    function (err) {
      alert("エラー: " + err.message);
    }
  );
});