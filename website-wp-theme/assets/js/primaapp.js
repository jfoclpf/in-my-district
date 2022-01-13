jQuery(document).ready(function ($) {
    var isRTL = '';
    if ($('body').hasClass('rtl')) {
        isRTL = true;
    } else {
        isRTL = false;
    }

    var scrollTop = $(document).scrollTop();
    if (scrollTop > 50) {
        $('.site-header').addClass('scrolled');
    }
    $(document).scroll(function (e) {
        var scrollTop = $(document).scrollTop();
        if (scrollTop > 50) {
            $('.site-header').addClass('scrolled')
        } else {
            $('.site-header').removeClass('scrolled');
        }
    });


    $('#backToTop').on('click', function (event) {
        event.preventDefault();
        $('html, body').animate({
            scrollTop: 0
        }, 800);
    });

    $('.navbar-toggler').on('click', function (event) {
        $('body').toggleClass('noscroll');
        $(this).parents('.navbar').toggleClass('opened');
        var scrollTop = $(document).scrollTop();
        if (scrollTop < 50) {
            if ($(this).parents('.site-header').hasClass('scrolled')) {
                $(this).parents('.site-header').removeClass('scrolled');
            } else {
                $(this).parents('.site-header').addClass('scrolled');
            }
        }
    });

    $('#primary-nav .menu-item .nav-link:not(".dropdown-toggle")').on('click', function(){
        $('#primary-nav').parents('#nav-links').removeClass('show');
    });


    $('.page-template-landing-page ul.navbar-nav li a:not(.dropdown-toggle), .page-template-landing-page a.navbar-brand, .slide-button-container a').on('click', function (event) {
        if (this.hash !== "") {
            event.preventDefault();
            $('body').removeClass('noscroll');
            var hash = this.hash;
            $('html, body').animate({
                scrollTop: $(hash).offset().top - 70
            }, 800);
            $('.navbar-toggler').toggleClass('collapsed');
            $('.navbar-collapse').toggleClass('show');
        }
    });


    window.onscroll = function () {
        primaapp_scrollFunction()
    };

    function primaapp_scrollFunction() {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            document.getElementById("backToTop").style.display = "block";
        } else {
            document.getElementById("backToTop").style.display = "none";
        }
    }

    $('.video-box a').click(function (e) {
        e.preventDefault();
        $primaapp_play_button = $(this).find('.icon');
        var video = '<iframe allowfullscreen src="' + $primaapp_play_button.attr('data-video') + '"></iframe>';
        $primaapp_play_button.replaceWith(video);
        $('.video > img').css({opacity: 0});
    });

});