const fileList = document.getElementById('file-list-selected');

// JPGを選択
document.getElementById('jpg-upload').addEventListener('change', function(e) {
  for(let i = 0; i < e.target.files.length; i++){
    const li = document.createElement('li');
    li.textContent = e.target.files[i].name;
    fileList.appendChild(li);
  }
});
