function listSuggest(el) {
    const eltActive = document.getElementById('list-tab-keywords').getElementsByClassName('active')[0];
    if (eltActive) { eltActive.classList.remove('active'); }
    el.classList.add('active');

    const suggests = JSON.parse(localStorage.getItem('ngramsSuggests'));
    const suggestsHTML = suggests.map((item) => {
        if (item.includes(el.id)) { return `<li>${item}</li> `; }
        return '';
    }).join('');
    document.getElementById('nav-tab-suggest').innerHTML = `<ul>${suggestsHTML}</ul>`;
}

window.api.receive('esuggest:mainDataSuggestNGram', () => {
    /*
        - gobal variable pour stocker keywords & suggests
            https://stackoverflow.com/questions/49715862/using-ipc-in-electron-to-set-global-variable-from-renderer
    */

    const suggests = JSON.parse(localStorage.getItem('ngramsSuggests'));
    document.getElementById('totalSuggestionCount').textContent = suggests.length;

    const keywords = new Map(JSON.parse(localStorage.getItem('ngramsKeywords')));
    const keywordsSortedMap = new Map([...keywords.entries()].sort((a, b) => b[1] - a[1]));
    const listtabKeywords = document.getElementById('list-tab-keywords');
    document.getElementById('totalKeywordCount').textContent = keywordsSortedMap.size;

    keywordsSortedMap.forEach((value, key) => {
        const ahrefKeywordTag = document.createElement('a');
        const spanKeywordTag = document.createElement('span');

        ahrefKeywordTag.setAttribute('href', '#');
        ahrefKeywordTag.setAttribute('id', key);
        ahrefKeywordTag.setAttribute('class', 'list-group-item');
        ahrefKeywordTag.setAttribute('onclick', 'listSuggest(this)');
        ahrefKeywordTag.textContent = `${key} `;

        spanKeywordTag.setAttribute('class', 'badge bg-success');
        spanKeywordTag.innerText = value;

        ahrefKeywordTag.appendChild(spanKeywordTag);
        listtabKeywords.appendChild(ahrefKeywordTag);
    });
});
