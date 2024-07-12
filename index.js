const pc_counter = document.getElementById("counter");
const memoryEle = document.getElementById("memoryBox");
const programCounterEle = document.getElementById("counter");
const marEle = document.getElementById("mar");
const mbrEle = document.getElementById("mbr");
const opEle = document.getElementById("op");
const dstEle = document.getElementById("dst");
const srcEle = document.getElementById("src");
const accEle = document.getElementById("acc");
let memoryList = [];

let pc = -1;
let mem_size = 15;
let memory = Array(mem_size).fill(0);
let next_state = "pc";
let prev_state = "pc";
let mar, mbr, ir;
let op, dst, src;
let accLoaded = false;
let accCalculated = false;
let cf = 0,
  zf = 0;

class ACC {
  constructor() {
    this.acc = 0;
    this.operatorEle = document.getElementById("operator");
    this.operand1Ele = document.getElementById("operand1");
    this.operand2Ele = document.getElementById("operand2");
    this.resultEle = document.getElementById("result");
  }
  init() {
    this.acc = 0;
  }
  set(x) {
    this.acc = Number(x);
    this.operand1Ele.innerText = x;
  }
  add(x) {
    this.acc += Number(x);
    this.operand2Ele.innerText = x;
    this.operatorEle.innerText = "+";
    this.resultEle.innerText = this.acc;
  }
  sub(x) {
    this.acc -= Number(x);
    this.operand2Ele.innerText = x;
    this.operatorEle.innerText = "-";
    this.resultEle.innerText = this.acc;
  }
}
let acc = new ACC();

example = {
  sum1toN: [
    "store 10 3", // n (end)
    "store 11 0", // index (start)
    "store 12 0", // result
    "inc 11",
    "cmp 10 11",
    "add 12 11",
    "ja 3",
  ],
  addAtoB: ["store 10 1", "store 11 2", "add 10 11"],
};
example["sum1toN"].forEach((value, index) => {
  memory[index] = value;
});
// memory[0] = "store 10 10";
// memory[1] = "store 11 2";
// memory[2] = "move 12 11";
// memory[3] = "inc 12";
// memory[4] = "jmp 3";
// memory[5] = "inc 12";
// memory[6] = "inc 12";

function initMemory() {
  for (let i = 0; i < mem_size; i++) {
    const li = document.createElement("li");
    li.id = `mem${i}`;
    li.innerText = 0;
    memoryList.push(li);
    memoryEle.appendChild(li);
  }
}

function updateMemory(idx = false) {
  if (idx) memoryList[idx].innerText = memory[idx];
  else {
    for (let i = 0; i < mem_size; i++) {
      var view = memoryList[i].innerText;
      var real = memory[i];
      if (view == real) memoryList[i].classList.remove("bg_red");
      else {
        memoryList[i].classList.add("bg_red");
        memoryList[i].innerText = real;
      }
    }
  }
}

initMemory();
updateMemory();

function updateIR(idx = null) {
  opEle.innerText = op;
  dstEle.innerText = dst;
  srcEle.innerText = src || "";
  for (let i = 0; i < mem_size; i++) {
    if (i == idx) memoryList[i].classList.add("bg_green");
    else memoryList[i].classList.remove("bg_green");
  }
}

function updatePC() {
  if (programCounterEle.innerText.split("|")[0].trim() == pc) {
    programCounterEle.innerHTML = pc;
  } else {
    programCounterEle.innerHTML =
      pc + "&nbsp;&nbsp;|&nbsp;&nbsp;<span class='bg_green'>(+1)</span>";
  }
}
function updateMar() {
  marEle.innerText = mar;
}
function updateMbr() {
  mbrEle.innerText = mbr;
}
function updateAcc() {
  accEle.innerText = acc.acc;
}
function next() {
  prev_state = next_state;
  switch (next_state) {
    case "pc":
      pc++;
      next_state = "mar";
      break;
    case "mar":
      if (memory && memory[pc]) {
        mar = pc;
        updateMar(mar);
      } else next = () => {};
      next_state = "ir";
      break;
    case "ir":
      ir = memory[mar];
      ir = ir.split(" ");
      op = ir[0];
      dst = ir[1];
      src = ir[2];
      updateIR(mar);

      if (op == "store" || op == "move") {
        next_state = "mbr";
      } else if (op == "inc") {
        memory[dst]++;
        next_state = "pc";
      } else if (op == "dec") {
        memory[dst]--;
        next_state = "pc";
      } else if (op == "jmp") {
        pc = dst;
        next_state = "mar";
      } else if (op == "ja" && cf == 0 && zf == 0) {
        pc = dst;
        next_state = "mar";
      } else if (op == "jb" && cf == 1) {
        pc = dst;
        next_state = "mar";
      } else if (op == "je" && zf == 0) {
        pc = dst;
        next_state = "mar";
      } else if (op == "cmp") {
        next_state = "cmp";
      } else if (op == "add" || op == "sub") {
        next_state = "mbr";
      } else {
        next_state = "pc";
      }
      break;
    case "mbr":
      if (op == "store") {
        mbr = src;
        next_state = "store";
      } else if (op == "move") {
        mbr = memory[src];
        next_state = "store";
      } else if (op == "add" || op == "sub") {
        if (!accLoaded && !accCalculated) {
          mbr = memory[dst];
          next_state = "acc";
        } else if (accLoaded && !accCalculated) {
          mbr = memory[src];
          next_state = "acc";
        } else {
          mbr = acc.acc;
          next_state = "store";
          accLoaded = false;
          accCalculated = false;
        }
      }
      updateMbr();
      break;
    case "acc":
      if (!accLoaded && !accCalculated) {
        acc.set(mbr);
        accLoaded = true;
        next_state = "mbr";
      } else if (accLoaded && !accCalculated) {
        if (op == "add") acc.add(mbr);
        else if (op == "sub") acc.sub(mbr);
        accCalculated = true;
        next_state = "mbr";
      }
      updateAcc();
      break;
    case "store":
      memory[dst] = mbr;
      next_state = "pc";
      break;
    case "cmp":
      const res = memory[dst] - memory[src]; // dst - src
      console.log("cmp", res);
      if (res < 0) {
        zf = 0;
        cf = 1;
      } else if (res == 0) {
        zf = 1;
        cf = 0;
      } else {
        zf = 0;
        cf = 0;
      }
      next_state = "pc";
      break;
  }
  updatePC();
  updateMemory();
  console.log(`${prev_state} -> ${next_state}`, pc, mar, memory, ir, zf, cf);
}
