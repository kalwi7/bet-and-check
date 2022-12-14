const gameListElement = document.querySelector(".last-matches-list");
const gameOddsElement = document.querySelector(".game-list");
const oddTilesList = document.querySelector("#odd-list");
const betsList = document.querySelector(".game-list--history");
const hisoryBets = document.querySelector(".bets-list");
const gameDetails = document.querySelector(".game-details__odds");
const clientPanel = document.querySelector(".client-panel");
const historyActiveWrap = document.querySelector(".game-details__bets");
// const tileScore = document.querySelector(".tileScore");

const api = "iTOZUEQfReJ1JFWOZERzkmgwAzRrcku75fQhwmoqz2XQEmkMmWOy1cZpGlBY";
const api2 = "hXaKsttEG25TfczCr206RzFTM1cxdGMAM1fS9OXeJRupAqQlE4VXZQqQpGYP";
const api3 = "PW1ycFbPdDklgZ7Q7wYTZC9jCRDjeWfj3gxMKEhQwYd4YYc84lVObiNA47rK";
const api4 = "yWjhHMDUavTIoqW7nlAgFJfHS0KXxt8P9HkZOX49r9cCU2gMsbenwSmPfEXF";
const api5 = "Xrt0s9CL0d1LuRSvhVImB191YJQpXkBUElFxhEZM9jy7LuZGCQ5kvybz1Nxt";

function getRnd(min, max) {
  return parseFloat((Math.random() * (max - min + 1) + min).toFixed(2));
}

const now = new Date();
let betsArr = [];
betsArr = JSON.parse(localStorage.getItem("myData"));

const requestOptions = {
  method: "GET",
  redirect: "follow",
};

//Update array with bets
const addBet = function (arr) {
  gameDetails.addEventListener("click", function (e) {
    const Matchid = parseInt(
      e.target.closest(".game-details__odds__variant").dataset.id,
      10
    );
    const winnerBetID = parseInt(
      e.target.closest(".game-details__odds__variant").dataset.teamid,
      10
    );

    if (!e.target.classList.contains("btn")) return;
    if (!betsArr.some((el) => el.gameID === Matchid)) {
      for (const game of arr) {
        if (game.matches.id === Matchid) {
          betsArr.push({
            gameID: game.matches.id,
            winner: game.matches.winner_team_id,
            teamsHome: game.teamsHome,
            teamsHomeId: game.matches.localteam_id,
            teamsVisitorsId: game.matches.visitorteam_id,
            teamsVisitors: game.teamsVisitors,
            time: game.time.slice(0, -3),
            scoreVisitor: game.scoreVisitor,
            scoreLocal: game.scoreLocal,
            odds: game.odds,
            bet: winnerBetID,
          });
        }
      }
    } else {
      alert("You have already placed a bet for this game");
    }

    checkGameResoult(betsArr);
  });
};

//Move game to the history tab
//added async function - potenial error
const checkGameResoult = async function (gamesArr) {
  const gamesArrHistory = gamesArr.filter(
    (game) => Date.parse(game.time) < Date.parse(now)
  );

  //  fetching game result if the game has been finished
  let fixture = await Promise.all(
    gamesArrHistory.map(async (game, i) => {
      const res = await takeFixture(game.gameID);
      console.log(res);
      game.scoreLocal = res.scores.localteam_score;
      game.scoreVisitor = res.scores.visitorteam_score;
      game.winner = res.winner_team_id;
    })
  );

  localStorage.setItem("myData", JSON.stringify(gamesArr));
  gamesArr = gamesArr.filter((game) => Date.parse(game.time) > Date.parse(now));

  renderBets(gamesArrHistory, hisoryBets);
  renderBets(gamesArr, betsList);
};

//create object with info about every match
const matches = function (matches, teamsHome, teamsVisitors, odds) {
  const tab = [];
  const time = [];
  const scoreLocal = [];
  const scoreVisitor = [];
  matches.map((game, i) => {
    time[i] = game.time.starting_at.date_time;
    scoreLocal[i] = game.scores.localteam_score;
    scoreVisitor[i] = game.scores.visitorteam_score;
  });

  for (i = 0; i < matches.length; i++) {
    tab[i] = {
      matches: matches[i],
      teamsHome: teamsHome[i],
      teamsVisitors: teamsVisitors[i],
      time: time[i],
      scoreVisitor: scoreVisitor[i],
      scoreLocal: scoreLocal[i],
      odds: odds[i],
    };
  }
  return tab;
};

const getJSON = async function (url) {
  try {
    const res = await fetch(url, requestOptions);
    const data = await res.json();
    if (!res.ok) throw new Error(`${data.message} (${res.status})`);
    return data;
  } catch (err) {}
};

const takeMatches = async function takeMatches(dateFrom, dateTo) {
  const res = await getJSON(
    `https://soccer.sportmonks.com/api/v2.0/fixtures/between/${dateFrom}/${dateTo}?api_token=${api2}`
  );

  return res.data;
};

const takeFixture = async function (fixtureId) {
  const res = await getJSON(
    `https://soccer.sportmonks.com/api/v2.0/fixtures/${fixtureId}?api_token=${api2}`
  );

  return res.data;
};

// Main function - fetching data and then calling callback functions
const init = async function (dateFrom, dateTo) {
  try {
    oddTilesList.innerHTML = "<div class='loader'></div>";
    const dateRange = new Date();
    dateRange.setDate(now.getDate() + 3);

    if (!dateFrom)
      dateFrom = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    if (!dateTo)
      dateTo = `${dateRange.getFullYear()}-${
        dateRange.getMonth() + 1
      }-${dateRange.getDate()}`;

    let matchesFromTo = await takeMatches(dateFrom, dateTo);

    let teamsVisitors = await Promise.all(
      matchesFromTo.map(async (team, i) => {
        const res = await getJSON(
          `https://soccer.sportmonks.com/api/v2.0/teams/${team.visitorteam_id}?api_token=${api2}`
        );
        return { name: res.data.name, logo: res.data.logo_path };
      })
    );

    let teamsHome = await Promise.all(
      matchesFromTo.map(async (team, i) => {
        const res = await getJSON(
          `https://soccer.sportmonks.com/api/v2.0/teams/${team.localteam_id}?api_token=${api2}`,
          requestOptions
        );
        return { name: res.data.name, logo: res.data.logo_path };
      })
    );

    let odds = await Promise.all(
      matchesFromTo.map(async (game, i) => {
        const res = await getJSON(
          `https://soccer.sportmonks.com/api/v2.0/odds/fixture/${game.id}/bookmaker/97?api_token=${api2}`,
          requestOptions
        );

        return {
          team1win:
            res.data[i]?.bookmaker.data[0].odds.data[0]?.value ?? getRnd(1, 9),
          draw:
            res.data[i]?.bookmaker.data[0].odds.data[1]?.value ?? getRnd(1, 9),
          team2win:
            res.data[i]?.bookmaker.data[0].odds.data[2]?.value ?? getRnd(1, 9),
        };
      })
    );

    let nextMatches = matches(matchesFromTo, teamsHome, teamsVisitors, odds);

    renderMatches(nextMatches);

    renderGameDetails(nextMatches);

    addBet(nextMatches);

    checkGameResoult(betsArr);
  } catch (err) {
    alert(err);
  }
};

init();

//listen for changing the range of showed games, and inits main function with new data
clientPanel.addEventListener("click", function (e) {
  oddTilesList.innerHTML = "<div class='loader'></div>";
  const range = parseInt(e.target.dataset.days, 10);
  const dateRange = new Date();

  dateRange.setDate(now.getDate() + range);
  dateFrom = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  dateTo = `${dateRange.getFullYear()}-${
    dateRange.getMonth() + 1
  }-${dateRange.getDate()}`;

  init(dateFrom, dateTo);
});

//listen for close btn and remove elements from bets list
historyActiveWrap.addEventListener("click", function (e) {
  if (!e.target.classList.contains("btn-close")) return;

  const clickedTile = e.target.closest(".tile");
  const id = parseInt(clickedTile.dataset.id, 10);

  betsArr = betsArr.filter((el) => el.gameID !== id);
  localStorage.setItem("myData", JSON.stringify(betsArr));

  clickedTile.remove();
});

//rendering initial table with matches, where user choosing the game
function renderMatches(gamesData) {
  oddTilesList.innerHTML = "";

  for (const game of gamesData) {
    const htmlOdds = `
  <li class="tile"  data-id="${game.matches.id}">
    <div class="tile__team-preview">
      <div class="tile__team-preview__img-score">
       <img src=${game.teamsHome.logo} alt="logo"/>
       <div class="tile__team-preview__name">${game.teamsHome.name}</div>
      </div>
      <div class="tile__team-preview__score">${game.odds.team1win}</div>
    </div>
      <div class="tile__draw tile__team-preview">
       <div class="tile__team-preview__name tile__team-preview__draw">X</div>
       <div class="tile__team-preview__score tile__team-preview__odd">${
         game.odds.draw
       }</div>
        </div>
    <div class="tile__away tile__team-preview">
      <div class="tile__team-preview__img-score">
      <img
      src=${game.teamsVisitors.logo}
        alt="logo"
      />
      <div class="tile__team-preview__name">${game.teamsVisitors.name}</div>
      </div>
        <div class="tile__team-preview__score">${game.odds.team2win}</div>
    </div>
      <span class="match-date">${game.time.slice(0, -3)}</span>
  </li>`;

    if (Date.parse(game.time) > Date.parse(now)) {
      gameOddsElement.insertAdjacentHTML("beforeend", htmlOdds);
    }
  }
}

//rendering the area where user place his bet
const renderGameDetails = function (arr) {
  oddTilesList.addEventListener("click", function (e) {
    const id = parseInt(e.target.closest(".tile").dataset.id, 10);

    for (const game of arr) {
      if (game.matches.id === id) {
        const html = `
          <div class="game-details__odds__variant teamA" data-id="${game.matches.id}" data-teamId="${game.matches.localteam_id}">
            <div class="tile__team-preview tile__team-preview--odd">
              <div class="tile__team-preview__img-score game-details-img-score">
                <img
                  src=${game.teamsHome.logo}
                  alt="logo"
                />
                <div class="tile__team-preview__name game-details-name">${game.teamsHome.name}</div>
                </div>
                <div class="tile__team-preview__score game-details-odd">${game.odds.team1win}</div>
                <button type="button" class="btn">Bet</button>
            </div>
          </div>
          <div class="game-details__odds__variant draw" data-id="${game.matches.id}">
            <div class="tile__draw tile__draw--odd">
              <div class="tile__team-preview__name tile__team-preview__draw game-details-name">
                X
              </div>
              <div class="tile__team-preview__score game-details-odd tile__team-preview__odd">
              ${game.odds.draw}
              </div>
              <button type="button" class="btn">Bet</button>
            </div>
          </div>
          <div class="game-details__odds__variant teamB" data-id="${game.matches.id}" data-teamId="${game.matches.visitorteam_id}">
            <div class="tile__team-preview tile__team-preview-odd">
              <div class="tile__team-preview__img-score game-details-img-score">
                <img
                  src=${game.teamsVisitors.logo}
                  alt="logo"
                />
                <div class="tile__team-preview__name game-details-name">${game.teamsVisitors.name}</div>
              </div>
              <div class="tile__team-preview__score game-details-odd">${game.odds.team2win}</div>
              <button type="button" class="btn">Bet</button>   
              </div>
          </div>`;

        gameDetails.innerHTML = html;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  });
};

//Rendering chosen bets in proper table - history or active
const renderBets = function (betsArr, placeToRender) {
  placeToRender.innerHTML = "";

  for (const game of betsArr) {
    const html = ` 
    <li class="tile" data-id="${game.gameID}">
      <div id="localteam" class="tile__team-preview " data-teamBetId="${
        game.teamsHomeId
      }">
        <div class="tile__team-preview__img-score">
          <div class="tile__team-preview__name">${
            game.teamsHome.name
          }<span class="tileScore">${
      placeToRender === hisoryBets ? `: ${game.scoreLocal}` : ""
    }</span></div>
        </div>
        <div class="tile__team-preview__score">${game.odds.team1win}</div>
      </div>
        <div class="tile__draw">
        <div class="tile__team-preview__name tile__team-preview__draw">Draw</div>
        <div class="tile__team-preview__score tile__team-preview__odd">${
          game.odds.draw
        }</div>
      </div>
      <div id="visitorteam" class="tile__team-preview" data-teamBetId="${
        game.teamsVisitorsId
      }">
        <div class="tile__team-preview__img-score">
          <div class="tile__team-preview__name">${
            game.teamsVisitors.name
          }<span class="tileScore">${
      placeToRender === hisoryBets ? `: ${game.scoreVisitor}` : ""
    }</span></div>
        </div>
        <div class="tile__team-preview__score">${game.odds.team2win}</div>
      </div>
        <span class="btn-close"></span>
        <span class="match-date">${game.time}</span>
    </li>`;

    placeToRender.insertAdjacentHTML("beforeend", html);

    //Selecting elements and adding class to mark the chosen result
    let localteam = document.querySelector(
      `[data-teamBetId="${game.teamsHomeId}"]`
    );
    let visitorteam = document.querySelector(
      `[data-teamBetId="${game.teamsVisitorsId}"]`
    );
    let draw = visitorteam.parentElement.querySelector(".tile__draw");

    if (game.bet === game.teamsHomeId) {
      localteam.classList.add("winner-bet");
    } else if (game.bet === game.teamsVisitorsId) {
      visitorteam.classList.add("winner-bet");
    } else {
      draw.classList.add("winner-bet");
    }

    if (Date.parse(game.time) < Date.parse(now)) {
      if (game.winner === game.bet || game.bet === game.winner) {
        localteam.closest(".tile").classList.add("winner-ok");
      } else localteam.closest(".tile").classList.add("winner-lose");
    }
  }
};
