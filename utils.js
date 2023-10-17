//急所の判定
const check_vital = (
    vital_rank
) => {
    randomNumber = Math.random();
    if (randomNumber < vital_rate[vital_rank]) {
        return true
    }
    return false
}

const vital_rate = [1 / 24, 1 / 8, 1 / 2, 1 / 1]

// console.log("vital_rank: 3", check_vital(3))

//ターンの並び替え
const sort_turn = (
    u_poke,
    e_poke,
) => {
    //トリックルーム
    if (pokemon[u_poke][6] > pokemon[e_poke][6]) {
        return 1
    }
    else if (pokemon[u_poke][6] === pokemon[e_poke][6]) {
        return Math.random() < 0.5 ? 0 : 1;
    }
    else {
        return 0
    }
}

//ランクの初期化
function init_u_rank(u_pokes, u_poke) {
    u_pokes[u_poke][12] = init_rank
}
function init_e_rank(e_pokes, e_poke) {
    e_pokes[e_poke][12] = init_rank
}