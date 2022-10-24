$(function () {
    const locationId = $('locationId').text().trim();
    const startDate = $('startDate').text().trim();
    const location = $('location').text().trim();
    const timeLeft = $('.countdown_timer');
c
    const bar = $('bar');
    const REFRESH_MINUTES = 3; 
    const REFRESH_TIME = REFRESH_MINUTES * 60 * 1000; // 3 minutes
    let interval = null;
    // const TRANSITION_COLOR = '#AED6F1';
    // const AFTER_TRANSITION_COLORS = {
    //     "PENDING": "wheat",
    //     "CANCELLED": "wheat",
    //     "COMPLETED": "white",
    //     "TOTAL": "white",
    //     "OPEN": "pink",
    //     "time": "white"
    // };
    // let indicator;

    run_indicator();
    function run_indicator() {
        if (+$('#OPEN_TOTAL').text().trim() === 0) {
            if (interval) clearInterval(interval);
            // if (indicator) clearInterval(indicator);
            init_timer('Done')
            bar.css("width", "80%").css('background-color', 'green');
            $("body").css('background-color', 'lightgrey');
        }
        else {
            draw(Date.now(), REFRESH_TIME);
        }
    }

    function draw(start, end) {
        bar.css("width", 0.1 + "%");
        init_timer('3:00');

        interval = setInterval(() => {
            const nowMS = Date.now() - start;
            const now = nowMS / 1000 / 60;
            let min = Math.floor(REFRESH_MINUTES - now);
            let sec = Math.floor((REFRESH_MINUTES - now - min) * 60);
            sec = Math.round(sec / 5) * 5;
            if (sec < 10) sec = '0' + sec;
            if (min < 0) {
                min = REFRESH_MINUTES;
                sec = '00';
            }
            timeLeft.html(`<i class="fas fa-history"></i>&nbsp;${min}:${sec}&nbsp;`);

            let percent = 80 - (REFRESH_MINUTES - now) * 80 / REFRESH_MINUTES; // assumes 3 minute in cycle
            bar.css("width", percent + "%")
            if (nowMS >= (.995) * end) {
                clearInterval(interval);
                interval = null;
                refreshValues().then(() => run_indicator())
            }
        }, 5000)
    }

    async function refreshValues() {
        const url = `/refresh/${startDate}/${encodeURI(location)}/${locationId}`;
        let vs = await axios.get(url);
        vs = vs.data;
        // console.log('refreshValues')
        // TODO: transitions??
        for (let part of ['OPEN', 'COMPLETED', 'PENDING', 'CANCELLED', 'NO_SHOW']) {
            for (let vac of ['P', 'M', 'J']) {
                const id = `${part}_${vac}`; // html id
                $(`#${id}`).text(vs[part][vac]);
            }
        }
        for (let id of ['OPEN_TOTAL', 'COMPLETED_TOTAL',
            'TOTAL_OC_P', 'TOTAL_OC_M', 'TOTAL_OC_J',
            'TOTAL_OC',
            'PENDING_TOTAL', 'CANCELLED_TOTAL', 'NO_SHOW_TOTAL']) {

            $(`#${id}`).text(vs[id]);
        }
        // DEBUGGING: $(`#OPEN_TOTAL`).text('0'); - test end condition
        // for (let tag of data) {

        //     const target = $('#' + tag);

        //     target.css("background", TRANSITION_COLOR).text(data[tag]);

        //     setTimeout(() => {
        //         target.css('background', AFTER_TRANSITION_COLORS[tag]);
        //     }, 500);
        //     if (data['OPEN'] == 0) {
        //         clearInterval(interval);
        //         if(indicator) clearInterval(indicator);
        //         $("#bar").css("width", "100%").css('background-color','green').css('display', 'block');
        //     }
        // }

    }

    function init_timer(text) {
        timeLeft.html(`<i class="fas fa-history"></i>&nbsp;${text}`);
    }
});
