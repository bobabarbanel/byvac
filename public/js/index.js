$(function () {
    $('.site input').prop('checked', false);
    $('.site input').on("change", function() {
        $('#pickdate').show();
        setTimeout('$("#datepicker").focus();', 320);
    })
    $(window).on('focus', function() {
        $('#pickdate').hide();
        $('#datepicker').datepicker('setDate', null);
        $('.site input:checked').prop('checked', false);
    })

    $("#datepicker").datepicker().on('change', handleDate);
    function handleDate() {
        $("#datepicker").datepicker("option", "dateFormat", 'yy-mm-dd');
        const startDate = $(this).val();
        const location = $('.site input:checked').parent().text().replace(/\//, '_'); // remove '/' in location text
        const locationId = $('.site input:checked').val();
        
        // console.log(startDate, location, locationId);
        window.open(`/appts/${startDate}/${location}/${locationId}`, '_self');
        // window.open(`/appts/${startDate}/${location}`);
    }
});