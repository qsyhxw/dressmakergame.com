import os, glob, re

target_code = """  <!-- Google tag (GA4) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-RVY53PS7NP"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-RVY53PS7NP');
  </script>

  <!-- Google AdSense (keep for manual ads; disable Auto ads in dashboard or add exclusions) -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8830315294299920" crossorigin="anonymous"></script>
"""

dir_path = r'd:\Antigravity\dressmakergame.com'
html_files = glob.glob(os.path.join(dir_path, '**/*.html'), recursive=True)

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Clean up existing GA4 tags and AdSense tags to avoid duplication
    content = re.sub(r'\s*<!-- Google tag \(GA4\) -->.*?</script>\s*<script>.*?</script>\s*', '\n', content, flags=re.DOTALL)
    content = re.sub(r'\s*<!-- Google AdSense.*?</script>\s*', '\n', content, flags=re.DOTALL)

    # Inject the clean block of tracking codes just before </head>
    if '</head>' in content:
        new_content = content.replace('</head>', '\n' + target_code + '</head>')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Successfully updated {os.path.basename(file_path)}')
