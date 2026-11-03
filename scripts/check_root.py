html = open('dashboard_dom.html', encoding='utf-8').read()
idx = html.find('<div id="root">')
if idx != -1:
    print('Found root:')
    print(html[idx:idx+400])
else:
    print('root not found')
