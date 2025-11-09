import json
import img2pdf
import boto3
import os
import shutil
from urllib.parse import unquote_plus

s3 = boto3.client('s3')

def clean_tmp():
    for path in ['/tmp/jpg_files', '/tmp/pdf_files']:
        if os.path.exists(path):
            shutil.rmtree(path)
    os.makedirs('/tmp/jpg_files', exist_ok=True)
    os.makedirs('/tmp/pdf_files', exist_ok=True)

def lambda_handler(event, context):
    clean_tmp()
    
    uploaded_files = []
    pdf_bucket = 'merged-pdf'

    # バケット名を取得
    source_bucket = event["Records"][0]["s3"]["bucket"]["name"]
    
    response = s3.list_objects_v2(Bucket=source_bucket, Prefix='jpg_files/')
    
    if 'Contents' not in response:
        print("バケットにファイルがありません")
        return
    
    for obj in response['Contents']:
        key = obj['Key']
        
        # フォルダをスキップ
        if key.endswith('/'):
            continue
        
        # txtファイルをスキップ
        if key.endswith('.txt'):
            continue
        
        #　デバッグ用
        print(f"Bucket: [{source_bucket}]")
        print(f"Key: [{key}]")

        local_path = f'/tmp/{key}'
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        s3.download_file(source_bucket, key, local_path)
        uploaded_files.append(local_path)
    
    uploaded_files.sort()

    # A4サイズ
    a4_layout = img2pdf.get_layout_fun((img2pdf.mm_to_pt(210), img2pdf.mm_to_pt(297)))
    
    # ファイル数を取得
    pdf_response = s3.list_objects_v2(Bucket=pdf_bucket, Prefix='pdf_files/')
    existing_pdf_count = pdf_response.get('KeyCount', 0)
    output_filename = f"merged({existing_pdf_count}).pdf"
    output_path = f"/tmp/pdf_files/{output_filename}"

    # PDFを作成
    with open(output_path, "wb") as f:
        f.write(img2pdf.convert(uploaded_files, layout_fun=a4_layout))
    
    s3_key = f'pdf_files/{output_filename}'

    s3.upload_file(output_path, pdf_bucket, s3_key)

    for obj in response['Contents']:
        key = obj['Key']
        if not key.endswith('/'):
            s3.delete_object(Bucket=source_bucket, Key=key)

    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': pdf_bucket, 'Key': s3_key},
        ExpiresIn=3600
    )

    # URLをjsonファイルとして保存
    result_bucket = 'presigned---url'
    s3.put_object(
        Bucket=result_bucket,
        Key='url.json',
        Body=json.dumps({'url': url}),
        ContentType='application/json'
    )