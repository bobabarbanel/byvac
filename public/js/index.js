$(function () {
    $('.site input').on("change", function() {
        $('#pickdate').show();
    })
    $("#datepicker").datepicker().on('change', handleDate);
    function handleDate() {
        $("#datepicker").datepicker("option", "dateFormat", 'yy-mm-dd');
        const startDate = $(this).val();
        const location = $('.site input:checked').parent().text().replace(/\//, '_'); // remove '/' in location text
        const locationId = $('.site input:checked').val();
        console.log(startDate, location, locationId);
        window.open(`/appts/${startDate}/${location}/${locationId}`);
        // window.open(`/appts/${startDate}/${location}`);
    }
});