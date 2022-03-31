/* eslint-disable no-unused-vars */

const echarts = window.api.require('../js/echarts.js');

echarts.initSuggestEcharts('echarts');

function sendForm(event) {
    event.target.classList.add('was-validated');

    if (!event.target.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
    } else {
        window.api.receive('esuggest:fromMain', (data) => {
            document.getElementById('loadingSuggest').classList.add('d-none');
            document.getElementById('fctSuggest').classList.remove('d-none');
            document.getElementById('echarts').classList.remove('d-none');

            echarts.drawSuggestEcharts(data);
        });

        document.getElementById('loadingSuggest').classList.remove('d-none');
        document.getElementById('fctSuggest').classList.add('d-none');
        document.getElementById('echarts').classList.add('d-none');

        const keywords = document.getElementById('Keywords').value;
        const language = document.getElementById('Language').value;
        const country = document.getElementById('Country').value;
        window.api.send('esuggest:searchSuggest', keywords, language, country);
    }
}

function downloadSuggest() {
    const echartsData = echarts.getDataEcharts();
    window.api.send('esuggest:downloadSuggest', echartsData);
}

function showSuggestNGram() {
    const echartsData = echarts.getDataEcharts();
    window.api.send('esuggest:showSuggestNGram', echartsData);
}
