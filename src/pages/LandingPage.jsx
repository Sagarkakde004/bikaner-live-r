import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function TicTacToe({ onClose }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [current, setCurrent] = useState("X");
  const [scores, setScores] = useState({ X: 0, O: 0, D: 0 });
  const [mode, setMode] = useState("pvp");
  const [difficulty, setDifficulty] = useState("hard");
  const [status, setStatus] = useState({ msg: "X's turn", winner: null, line: [] });
  const [aiThinking, setAiThinking] = useState(false);

  const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  const checkResult = (b) => {
    for (const [a,c,d] of WINS) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { winner: b[a], line: [a,c,d] };
    }
    if (b.every(Boolean)) return { winner: "D", line: [] };
    return null;
  };

  const minimax = (b, player, depth=0, alpha=-Infinity, beta=Infinity) => {
    const res = checkResult(b);
    if (res) return { score: res.winner==="O" ? 10-depth : res.winner==="X" ? depth-10 : 0 };
    const moves = b.map((_,i)=>i).filter(i=>!b[i]);
    let best = { score: player==="O" ? -Infinity : Infinity, index: -1 };
    for (const m of moves) {
      const nb=[...b]; nb[m]=player;
      const val = minimax(nb, player==="O"?"X":"O", depth+1, alpha, beta).score;
      if (player==="O" ? val>best.score : val<best.score) best={score:val,index:m};
      if (player==="O") alpha=Math.max(alpha,val); else beta=Math.min(beta,val);
      if (beta<=alpha) break;
    }
    return best;
  };

  const placeMove = (b, idx, player) => {
    const nb = [...b]; nb[idx] = player;
    const result = checkResult(nb);
    const nextPlayer = player==="X"?"O":"X";
    if (result) {
      setScores(s => ({...s, [result.winner]: s[result.winner]+1}));
      setStatus({ msg: result.winner==="D" ? "It's a Draw! 🤝" : `${result.winner==="O"&&mode==="ai"?"🤖 CPU":("Player "+result.winner)} wins! 🎉`, winner: result.winner, line: result.line });
    } else {
      setStatus({ msg: `${nextPlayer==="O"&&mode==="ai"?"🤖 CPU":("Player "+nextPlayer)}'s turn`, winner: null, line: [] });
      setCurrent(nextPlayer);
      if (mode==="ai" && nextPlayer==="O") {
        setAiThinking(true);
        setTimeout(() => {
          const empty = nb.map((_,i)=>i).filter(i=>!nb[i]);
          let ai = difficulty==="easy" ? empty[Math.floor(Math.random()*empty.length)]
            : difficulty==="medium" ? (Math.random()<0.5 ? minimax(nb,"O").index : empty[Math.floor(Math.random()*empty.length)])
            : minimax(nb,"O").index;
          placeMove(nb, ai, "O");
          setAiThinking(false);
        }, 400);
        setBoard(nb);
        return;
      }
    }
    setBoard(nb);
  };

  const click = (i) => {
    if (board[i] || status.winner !== null || aiThinking) return;
    if (mode==="ai" && current==="O") return;
    placeMove(board, i, current);
  };

  const resetRound = () => {
    setBoard(Array(9).fill(null));
    setCurrent("X");
    setStatus({ msg: "X's turn", winner: null, line: [] });
    setAiThinking(false);
  };

  return (
    <div className="game-overlay">
      <div className="game-sheet">
        <div className="game-header">
          <h2>🎮 Tic Tac Toe</h2>
          <button className="game-close" onClick={onClose}>✕</button>
        </div>

        <div className="mode-row">
          <button className={`mode-btn ${mode==="pvp"?"active":""}`} onClick={()=>{setMode("pvp");setScores({X:0,O:0,D:0});resetRound();}}>👥 2 Players</button>
          <button className={`mode-btn ${mode==="ai"?"active":""}`} onClick={()=>{setMode("ai");setScores({X:0,O:0,D:0});resetRound();}}>🤖 vs CPU</button>
        </div>

        {mode==="ai" && (
          <div className="diff-row">
            {["easy","medium","hard"].map(d=>(
              <button key={d} className={`diff-btn ${difficulty===d?"active":""}`} onClick={()=>{setDifficulty(d);resetRound();}}>{d}</button>
            ))}
          </div>
        )}

        <div className="ttt-scores">
          <div className={`score-card x-card ${status.winner==="X"?"winner":""}`}>
            <div className="score-name">Player X</div>
            <div className="score-num">{scores.X}</div>
          </div>
          <div className="score-card d-card">
            <div className="score-name">Draws</div>
            <div className="score-num">{scores.D}</div>
          </div>
          <div className={`score-card o-card ${status.winner==="O"?"winner":""}`}>
            <div className="score-name">{mode==="ai"?"🤖 CPU":"Player O"}</div>
            <div className="score-num">{scores.O}</div>
          </div>
        </div>

        <div className="ttt-status">{status.msg}</div>

        <div className="ttt-board">
          {board.map((cell, i) => (
            <div
              key={i}
              className={`ttt-cell ${cell?"filled":""} ${cell?.toLowerCase()||""} ${status.line.includes(i)?"win-cell":""}`}
              onClick={()=>click(i)}
            >
              {cell==="X"?"✕":cell==="O"?"○":""}
            </div>
          ))}
        </div>

        <div className="ttt-btns">
          <button className="ttt-btn primary" onClick={resetRound}>New Round</button>
          <button className="ttt-btn secondary" onClick={()=>{setScores({X:0,O:0,D:0});resetRound();}}>Reset All</button>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableNo = searchParams.get("table") || "1";
  const [gameOpen, setGameOpen] = useState(false);

  return (
    <div className="landing-page">
      {/* Animated background */}
      <div className="landing-bg">
        <div className="bokeh bokeh-1" />
        <div className="bokeh bokeh-2" />
        <div className="bokeh bokeh-3" />
      </div>

      <div className="landing-content">
        {/* Logo */}
        <div className="landing-logo">
          <div className="logo-emblem">🪔</div>
          <div className="logo-name">Bikaner <em>Branch</em></div>
          <div className="logo-sub">Kanhan · Since 1996</div>
          <div className="logo-divider" />
        </div>

        {/* Table chip */}
        <div className="landing-table">
          <div className="landing-greeting">Welcome to your table</div>
          <div className="table-badge">🪑 Table {tableNo}</div>
        </div>

        {/* Option cards */}
        <div className="landing-options">
          <button
            className="opt-card opt-menu"
            onClick={() => navigate(`/menu?table=${tableNo}`)}
          >
            <div className="opt-icon">🍽️</div>
            <div className="opt-text">
              <div className="opt-title">Order Food</div>
              <div className="opt-desc">Browse our menu & place your order directly</div>
            </div>
            <span className="opt-arrow">›</span>
          </button>

          <button
            className="opt-card opt-website"
            onClick={() => navigate("/website")}
          >
            <div className="opt-icon">🌐</div>
            <div className="opt-text">
              <div className="opt-title">Our Story</div>
              <div className="opt-desc">Explore Bikaner's legacy, sweets & full catalogue</div>
            </div>
            <span className="opt-arrow">›</span>
          </button>

          <button
            className="opt-card opt-game"
            onClick={() => setGameOpen(true)}
          >
            <div className="opt-icon">🎮</div>
            <div className="opt-text">
              <div className="opt-title">Play a Game</div>
              <div className="opt-desc">Tic Tac Toe — challenge a friend while you wait!</div>
            </div>
            <span className="opt-arrow">›</span>
          </button>
        </div>

        {/* Social */}
        <div className="landing-social">
          <a href="https://wa.me/918007470011" target="_blank" rel="noreferrer" className="soc-btn">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.004 2C6.485 2 2.002 6.483 2 11.998c0 1.765.462 3.489 1.34 5.01L2 22l5.12-1.321A10.013 10.013 0 0012.004 22C17.524 22 22 17.517 22 12.002 22 6.487 17.524 2 12.004 2z"/></svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="soc-btn">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="soc-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
          </a>
        </div>

        <div className="landing-footer">✦ Bikaner Sweets & Restaurant · Kanhan, Nagpur ✦</div>
      </div>

      {gameOpen && <TicTacToe onClose={() => setGameOpen(false)} />}
    </div>
  );
}
