import axios from "axios";
import React from "react";

import "./App.css"

const SCOREMAP = [1, 100, 150, 200, 300, 0];

function secFormat(value) {
    if (isNaN(value)) {
        return "NaN"
    }

    let seconds = value % 60;
    value = parseInt((value - seconds) / 60);

    let minutes = value % 60;
    value = parseInt((value - minutes) / 60);

    return `${value}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function getScore(timestampArray, exscore=false) {
    let totalTime = 0;
    let totalScore = 0;
    timestampArray.forEach((timestamp, index) => {
        if (!isNaN(timestamp)) {
            if (index === 5 && exscore) {
                totalScore += 0.1;
            }
            else {
                totalScore += SCOREMAP[index];
            }
            totalTime += timestamp;
        }
    });
    return [totalScore, totalTime];
}

function comp(item1, item2) {
    let score1 = getScore(item1[1], true);
    let score2 = getScore(item2[1], true);

    if (score1[0] === score2[0]) {
        return score1[1] - score2[1];
    }
    return score2[0] - score1[0];
}

export default class App extends React.Component {
    constructor() {
        super();
        this.state = {
            data: [],
            bestTimeArray: [0, 0, 0, 0, 0, 0]
        };
    }

    componentDidMount() {
        this.reload();
        setInterval(() => {
            this.reload();
        }, 60000)
    }

    reload() {
        axios.get("/api").then(
            (response) => {
                const rawData = response.data.replaceAll(",}", "}");
                const data = JSON.parse(rawData);
                let currentBestTimeArray = this.state.bestTimeArray;
                
                // 尋找最快解題時間
                Object.values(data).forEach((timestampArray) => {
                    timestampArray.forEach((timestamp, index) => {
                        if (timestamp === 0) {
                            return
                        }
                        const bestTime = currentBestTimeArray[index];
                        timestamp -= 1689120000;
                        if (timestamp < bestTime || bestTime === 0) {
                            currentBestTimeArray[index] = timestamp;
                        }
                    })
                })

                // 轉換資料結構
                let result = Object.keys(data).map((key) => {
                    let timestampArray = data[key];
                    return [
                        key,
                        // 換算為比賽開始後時間
                        timestampArray.map((timestamp) => {
                            if (timestamp === 0) {
                                return NaN
                            }
                            return timestamp - 1689120000 
                        })
                    ]
                }
                );
                result.sort(comp);
                this.setState({
                    data: result,
                    bestTimeArray: currentBestTimeArray,
                });
            }
        )

    }

    render() {
        const userColumn = this.state.data.map((data, index) => {
            const bestTimeArray = this.state.bestTimeArray;
            const userId = data[0];
            const timestampArray = data[1];

            return (
                <UserColumn
                    key={index}
                    userId={userId}
                    rank={index + 1}
                    timeData={timestampArray}
                    bestTimeArray={bestTimeArray}
                />
            )
        })
        return (
            <div id="content">
                <div className="title">隨便做的記分板 請善用Ctrl + F</div>
                <div id="scoreBoard">
                    <div className="userColumn">
                        <div>Rank</div>
                        <div>User ID</div>
                        <div>
                            <a rel="noreferrer" href="https://homosserver.jp.eu.org/problem/A.html" target="_blank">A. Chocolate Cupcakes</a>
                        </div>
                        <div>
                            <a rel="noreferrer" href="https://homosserver.jp.eu.org/problem/B.html" target="_blank">B. ???</a>
                        </div>
                        <div>
                            <a rel="noreferrer" href="https://homosserver.jp.eu.org/problem/C.html" target="_blank">C. Strawberry Shortcake</a>
                        </div>
                        <div>
                            <a rel="noreferrer" href="https://homosserver.jp.eu.org/problem/D.html" target="_blank">D. Mango Sticky Rice</a>
                        </div>
                        <div>
                            <a rel="noreferrer" href="https://homosserver.jp.eu.org/problem/E.html" target="_blank">E. Classical Tiramisu</a>
                        </div>
                        <div>
                            <a rel="noreferrer" href="https://homosserver.jp.eu.org/problem/Ex.html" target="_blank">Ex.Bababa Bread</a>
                        </div>
                        <div>Score</div>
                        <div>Time Used</div>
                    </div>
                    {userColumn}
                </div>
            </div>
        )
    }
}

class UserColumn extends React.Component {
    render() {
        const userId = this.props.userId;
        const rank = this.props.rank;
        const timeData = this.props.timeData;
        const bestTimeArray = this.props.bestTimeArray;

        const problemArray = timeData.map((timestamp, index) => {
            return (
                <div
                    key={index}
                    className={
                        [
                            timeData[index] === bestTimeArray[index] ? "best" : "",
                            isNaN(timeData[index]) ? "" : "finish",
                        ].join(" ")
                    }
                >{secFormat(timeData[index])}</div>
            )
        });

        const score = getScore(timeData);
        return (
            <div className="userColumn">
                <div>{rank}</div>
                <div>{userId}</div>
                {problemArray}
                <div>{score[0]}</div>
                <div>{secFormat(score[1])}</div>
            </div>
        )
    }
}
