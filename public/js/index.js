$(function () {
    $('.site input').prop('checked', false);
    // $("#launchButton").prop("disabled", true);
    let today = new Date();
    let month = today.getMonth() + 1;
    if (month < 10) month = "0" + month;
    let day = today.getDate();
    if (day < 10) day = "0" + day;
    const button = $('button');
    
    $('#datepicker').datepicker('setDate', null);

    $("#selectedDate").text(`${today.getFullYear()}-${month}-${day}`);


    $("#datepicker").datepicker({
        dateFormat: 'yy-mm-dd',
        onSelect: function (selectedDate) {
            $("#selectedDate").css("background-color", "red").text(selectedDate);
            setTimeout(() => {
                $("#selectedDate").css('background-color', "white");
            }, 500);
        }
    });

    $('li > input').on('change', handleSite);
    $('li > span').on('click', (e) => {
        $(e.target).parent().find('input').trigger('click');
    });
    button.on('click', launch);
    function handleSite() {
        $('ul li').css("background", "white");
        $(this).parent().css("background", "orange");
        button.prop("disabled", false);
    }
    function launch() {
        // console.log('launch');
        const startDate = $('#selectedDate').text().trim();
        const location = $('.site input:checked').parent().text().trim(); // .replace(/\//, '_'); // remove '/' in location text
        const locationId = $('.site input:checked').val();
        // console.log({startDate,location, locationId})
        $('container').hide();
        $('loading').show();
        fade_in($('loading'));
        window.open(`/appts/${startDate}/${encodeURI(location)}/${locationId}`, '_self');
    }
    async function fade_in(loadText) {
        let opacity = 0;
        loadText.css('background-color', `rgba(0,0,255,${opacity})`);
        
        const interval = setInterval(
            () => {
                opacity += 0.1;
                if(opacity > 1) clearInterval(interval);
                loadText.css('background-color', `rgba(0,0,255,${opacity})`);
            },
            250
        )
        return;
    }
});