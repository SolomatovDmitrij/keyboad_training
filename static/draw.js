window.error0 = [];
window.time0;
window.key_time0; 
window.key_array = [];
window.id_text;

function drawLogo() {
        var canvas = document.getElementById('canvas');
        canvas.width = 60;
        canvas.height = 50;      
        const ctx = canvas.getContext('2d');
        const k = 0.2;
        const x0 = 160;
        const y0 = 180;  
        //logotype A
        ctx.beginPath();
        
        ctx.moveTo((200-x0)*k, (410-y0)*k);
        ctx.lineTo((300-x0)*k, (220-y0)*k);
        ctx.lineTo((350-x0)*k, (220-y0)*k);
        ctx.lineTo((450-x0)*k, (410-y0)*k);
        
        ctx.moveTo((250-x0)*k, (410-y0)*k);
        ctx.arcTo((325-x0)*k, (345-y0)*k, (400-x0)*k, (410-y0)*k, 90*k);
        ctx.lineTo((400-x0)*k, (410-y0)*k);
        
        ctx.moveTo((285-x0)*k, (345-y0)*k);
        ctx.lineTo((325-x0)*k, (270-y0)*k);
        ctx.lineTo((365-x0)*k, (345-y0)*k);
            
        ctx.lineWidth = 25*k;
        ctx.strokeStyle = 'orange';   
        ctx.lineCap = "round";            
        ctx.stroke();
        canvas.addEventListener("click", Link_click, false);        
}
function load_function1() {
    input1 = document.getElementById("input1");
    const Http = new XMLHttpRequest();
    const url='http://192.168.0.210:3002/load_text';
    Http.open("POST", url);
    Http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    Http.send("new_text="+encodeURIComponent(input1.value));

}
function Link_click(e) {
    window.location.assign("http://192.168.0.210:3002");
        }

function start() {

    //var text0 = "";
    var span1 = document.getElementById("span1");
    var span2 = document.getElementById("span2");
    span1.innerText = "";
    time0 = Date.now();

    const Http = new XMLHttpRequest();
    const url='http://192.168.0.210:3002/text';
    Http.open("GET", url);
    Http.send();

    Http.onload = function() {
        var book1 = JSON.parse(Http.response);
        span2.innerText = book1.main_text;
        id_text = book1.id;
        //Кончился текст в базе данных
        if (book1 === '') {
            if (document.getElementById('load_btn') === null) {
                //создадим поля для ввода текста доя загрузки текста в базу
                var input1 = document.createElement("textarea");
                input1.setAttribute("id", "input1");
                document.body.appendChild(input1);
                //создадим новуб кнопку для загрузки текста в базу
                var btn_load_text_to_db = document.createElement("button");   
                btn_load_text_to_db.setAttribute("id", "load_btn");
                btn_load_text_to_db.innerHTML = "Загрузить текст в базу";                  
                //btn_load_text_to_db.onclick = load_function1;
                btn_load_text_to_db.setAttribute("onclick", "load_function1();");
                document.body.appendChild(btn_load_text_to_db);      
            }
        } else {
            key_time0 = Date.now();
            document.onkeydown = key_down_handler;
            btn0 = document.getElementById("btn_start0");
            btn0.blur();
        }

    }

}
function key_down_handler(key0) {

    //var typed0       = document.getElementById("typed_id");
    //var untyped0     = document.getElementById("untyped");
    var key_pressed0 = document.getElementById("key_pressed0");
    //var nodes0 = document.getElementById("untyped").childNodes;
    var span1 = document.getElementById("span1");
    var span2 = document.getElementById("span2");

    //key_pressed0.innerText = key0.key;
    if (span1.innerText == ''){
       key_time0  = Date.now();
       time0 = Date.now();
    }

    //key_pressed0.innerHTML = untyped0.innerHTML;

    if (span2.textContent.length==0) {
    error_count0 = error0.length;
    time_type0 = (Date.now() - time0)/1000;
    speed0 = Math.floor(span1.textContent.length * 60 / time_type0);
    //key_map0 = key_array.reduce(reduce_func0, []);
    //key_map0.map(map_func0);
    //key_map0.sort(compare0);
    //save result to database
    const Http = new XMLHttpRequest();
    const url='http://192.168.0.210:3002/result';
    Http.open("POST", url);
    //Http.setRequestHeader("textid", id_text);
//    Http.setRequestHeader("Content-Type", "application/json");
    Http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
//отправим данные о результатах на сервер
    let results = {
        resultsTextId : id_text,
        resultsTime2  : time_type0,
        resultsError_count : error_count0
    }
    Http.send("param=" + JSON.stringify(results)); 
//    Http.onload = function() {
//        span2.innerText = Http.responseText;
     alert("Game over! Error number: " + error_count0 + "\n\r" + error0 + "\n\r" + "время набора: " + time_type0 + " сек." + "\n\r" + "скорость: " + speed0 + " знаков в секунду" + "\n\r" + "Итого: " + (time_type0 + error_count0) + "\n\r");} //+ "Время нажатия клавиш: " + JSON.stringify(key_map0)) ; }
     
 //   }

    
   else {
    if (key0.key == span2.textContent[0]) {
    sym0 = span2.textContent[0];
    span1.textContent = span1.textContent + sym0;
    span2.textContent = span2.textContent.substr(1);

    } else if (key0.key !== 'Shift') {
    
        error0.push(span2.textContent[0]);

        text1_style = document.getElementById("text1").style;
        if (text1_style.animationName == 'error2') {
            text1_style.animationName = "error1";
        } else {
            text1_style.animationName = "error2";
        }
        text1_style.animationDuration = "1s";

        }
    
    key_array.push({'key0': key0.key, 'time0' : key_time0 - Date.now()});
    if (key0.key != "Shift") { key_time0 = Date.now(); }
    }
}

reduce_func0 = function(accumulator, currentValue, currentIndex, array) {
  //попробуем найти в аккумуляторе текущее значение
  key_name0 = currentValue.key0;
  index_find0 = accumulator.findIndex(x => key_name0 in x);
  if (index_find0 === -1) {
    var myObj = new Object;
    myObj[key_name0] = [currentValue.time0];
  	accumulator.push(myObj);
  } else {
    accumulator[index_find0][key_name0].push(currentValue.time0);
  }
  
  return accumulator;
}

map_func0 = function(currentValue) {
  
  val0 = currentValue[Object.keys(currentValue)[0]];
  len0 = val0.length;
  currentValue.len0 = len0;
  average0 = val0.reduce((a, c) => a += c) / len0;
  
  return currentValue[Object.keys(currentValue)[0]] = average0;
}

function compare0(a, b) {

	val_a = a[Object.keys(a)[0]];
  val_b = b[Object.keys(b)[0]];
  
  if (val_a < val_b) {
    return -1;
  }
  if (val_a > val_b) {
    return 1;
  }
  // a must be equal to b
  return 0;
}
