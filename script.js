let tg = window.Telegram.WebApp;
let buy = document.getElementById("buy");
let order = document.getElementById("order");

tg.expand();


buy.addEventListener("click", () => {
    document.getElementById("main_form").style.display = "none";
    document.getElementById("buy_form").style.display = "block";
});


order.addEventListener("click", () => {
    document.getElementById("error").innerText = '';
    let name = document.getElementById('user_name').value;
    let email = document.getElementById('user_email').value;
    let number = document.getElementById('user_number').value;

    if (name.length < 5) {
        document.getElementById("error").innerText = 'Ошибка в имени';
        return;
    }

    if (email.length < 5) {
        document.getElementById("error").innerText = 'Ошибка в email';
        return;
    }

    if (number.length < 5) {
        document.getElementById("error").innerText = 'Ошибка в номере телефона';
        return;
    }

    let data = {
        name: name,
        email: email,
        number: number
    };
    tg.sendData(JSON.stringify(data));

    tg.close();
});
