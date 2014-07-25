
$( document ).ready(function() {

    console.log( "ready!" );
    var count=0;

    $('button').on('click', function() {
    // Caching
    // var self = $('.active');
    
    // // Check if another element exists after the currently active one otherwise
    // // find the parent and start again
    // if (self.next().length) {
    //     self
    //         .removeClass('active')
    //         .next()
    //         .addClass('active');
    // } else {
    //     self
    //         .removeClass('active')
    //         .parent()
    //         .find('span:first')
    //         .addClass('active');
    // }

    var stop=window.setInterval(function(){
        count++;
        console.log(count);
        $('.light'+count+'').find('.redlight').addClass('active');

        if(count==6){
            console.log('stop');
            $('.greenlight').addClass('active');
            $('.redlight').removeClass('active');
            window.clearInterval(stop);
            count=0;

            setTimeout(function() {
               $('.greenlight').removeClass('active');
            }, 2000);
        }

        
        

    }, 1000);

    
});

});