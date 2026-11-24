const fs = require('fs');
const rows = {
    en: 'Deleted the copy you installed; the one still listed ships with the app.',
    'zh-CN': '已删除你自己安装的那份，列表里剩下的是应用自带的内置版本。',
    in: 'Salinan yang Anda pasang sudah dihapus; yang masih tampil adalah versi bawaan aplikasi.',
    vi: 'Đã xóa bản bạn tự cài; bản còn trong danh sách là bản đi kèm ứng dụng.',
};
for (const [lang, text] of Object.entries(rows)) {
    const p = `src/i18n/locales/${lang}.ts`;
    let s = fs.readFileSync(p, 'utf8');
    if (s.includes('uninstallKeptBuiltIn')) continue;
    const anchor = s.match(/^\s*"uninstallSuccess(_one|_other)?": .*$/m);
    if (!anchor) throw new Error(`anchor ${lang}`);
    const indent = anchor[0].match(/^\s*/)[0];
    s = s.replace(anchor[0], `${anchor[0]}\n${indent}"uninstallKeptBuiltIn": ${JSON.stringify(text)},`);
    fs.writeFileSync(p, s);
    console.log(lang, 'ok');
}
