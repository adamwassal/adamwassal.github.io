var count = document.querySelector('.count');
var number = 0;

function plus() {
    number++;
    count.textContent = number;
};

function minus() {
    if (number > 0) {
        number--;
        count.textContent = number;

    }
};

function clear_count() {
    number = 0;
    count.textContent = number;
};

