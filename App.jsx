import { useEffect, useState, useRef } from "react"
import { clsx } from "clsx"
import { languages } from "./languages"
import { words } from "./words"
import { roasts } from "./roasts"
import { achievements } from "./acheivements.js"
import {farewellMessages} from "./farewellMessages.js"

function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)]
}

function getFarewellText(langName) {
    return farewellMessages[langName] || `${langName} has fallen to Assembly...`
}

export default function AssemblyEndgame() {
    const alphabet = "QWERTYUIOPASDFGHJKLZXCVBNM"
    
    // Game state
    const [currentWord, setCurrentWord] = useState(() => getRandomWord())
    const [guessedLetters, setGuessedLetters] = useState([])
    const [gameRoast] = useState(() => roasts[Math.floor(Math.random() * roasts.length)])
    const [gameStartTime, setGameStartTime] = useState(Date.now())
    
    // Enhanced features state
    const [streak, setStreak] = useState(0)
    const [hints, setHints] = useState(3)
    const [powerUps, setPowerUps] = useState({ reveal: 2, freeze: 1 })
    const [theme, setTheme] = useState('dark')
    const [particles, setParticles] = useState([])
    const [shakeScreen, setShakeScreen] = useState(false)
    const [typingEffect, setTypingEffect] = useState('')
    const [showAchievement, setShowAchievement] = useState(null)
    
    // Stats and achievements
    const [stats, setStats] = useState(() => {
        const saved = JSON.parse(localStorage?.getItem?.("gameStats") || '{"wins": 0, "losses": 0, "perfectGames": 0, "fastestWin": null}')
        return saved
    })
    const [unlockedAchievements, setUnlockedAchievements] = useState(() => {
        return JSON.parse(localStorage?.getItem?.("achievements") || '[]')
    })
    
    // Audio refs
    const audioContextRef = useRef(null)
    
    // Game logic
    const numGuessesLeft = languages.length - 1
    const wrongGuessCount = guessedLetters.filter(letter => !currentWord.includes(letter)).length
    const isGameWon = currentWord.split("").every(letter => guessedLetters.includes(letter))
    const isGameLost = wrongGuessCount >= numGuessesLeft
    const isGameOver = isGameWon || isGameLost
    const lastGuessedLetter = guessedLetters[guessedLetters.length - 1]
    const isLastGuessIncorrect = lastGuessedLetter && !currentWord.includes(lastGuessedLetter)
    
    // Initialize audio context
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }, [])
    
    // Play sound effect
    const playSound = (frequency, duration, type = 'sine') => {
        if (!audioContextRef.current) return
        
        const oscillator = audioContextRef.current.createOscillator()
        const gainNode = audioContextRef.current.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContextRef.current.destination)
        
        oscillator.frequency.value = frequency
        oscillator.type = type
        gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration)
        
        oscillator.start(audioContextRef.current.currentTime)
        oscillator.stop(audioContextRef.current.currentTime + duration)
    }
    
    // Sound effects
    useEffect(() => {
        if (isGameWon) {
            // Victory sound
            setTimeout(() => playSound(523, 0.2), 0)
            setTimeout(() => playSound(659, 0.2), 200)
            setTimeout(() => playSound(784, 0.4), 400)
        }
        if (isGameLost) {
            // Defeat sound
            playSound(200, 0.5, 'sawtooth')
            setShakeScreen(true)
            setTimeout(() => setShakeScreen(false), 600)
        }
    }, [isGameWon, isGameLost])
    
    // Letter guess sound
    useEffect(() => {
        if (lastGuessedLetter) {
            if (currentWord.includes(lastGuessedLetter)) {
                playSound(400, 0.1)
                createParticle('✨')
            } else {
                playSound(150, 0.2, 'square')
                createParticle('💥')
            }
        }
    }, [lastGuessedLetter, currentWord])
    
    // Create particle effect
    const createParticle = (emoji) => {
        const id = Math.random()
        setParticles(prev => [...prev, { id, emoji, x: Math.random() * 100, y: 50 }])
        setTimeout(() => {
            setParticles(prev => prev.filter(p => p.id !== id))
        }, 1000)
    }
    
    // Check achievements
    const checkAchievements = (gameWon, gameTime, wasFlawless, wasClutch) => {
        const newAchievements = []
        
        if (gameWon && !unlockedAchievements.includes('first_win')) {
            newAchievements.push('first_win')
        }
        
        if (gameWon && streak >= 2 && !unlockedAchievements.includes('streak_3')) {
            newAchievements.push('streak_3')
        }
        
        if (gameWon && streak >= 4 && !unlockedAchievements.includes('streak_5')) {
            newAchievements.push('streak_5')
        }
        
        if (wasFlawless && !unlockedAchievements.includes('perfect_game')) {
            newAchievements.push('perfect_game')
        }
        
        if (wasClutch && !unlockedAchievements.includes('comeback_king')) {
            newAchievements.push('comeback_king')
        }
        
        if (gameTime < 30000 && gameWon && !unlockedAchievements.includes('speedrun')) {
            newAchievements.push('speedrun')
        }
        
        if (newAchievements.length > 0) {
            setUnlockedAchievements(prev => {
                const updated = [...prev, ...newAchievements]
                localStorage?.setItem?.("achievements", JSON.stringify(updated))
                return updated
            })
            
            newAchievements.forEach((achievementId, index) => {
                setTimeout(() => {
                    const achievement = achievements.find(a => a.id === achievementId)
                    setShowAchievement(achievement)
                    setTimeout(() => setShowAchievement(null), 3000)
                }, index * 1000)
            })
        }
    }
    
    // Typing effect for game over messages
    useEffect(() => {
        if (isGameOver && !typingEffect) {
            const message = isGameWon ? "VICTORY ACHIEVED!" : "SYSTEM COMPROMISED!"
            let i = 0
            const timer = setInterval(() => {
                if (i < message.length) {
                    setTypingEffect(message.slice(0, i + 1))
                    i++
                } else {
                    clearInterval(timer)
                }
            }, 100)
            return () => clearInterval(timer)
        }
    }, [isGameOver, typingEffect, isGameWon])
    
    function addGuessedLetter(letter) {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
        }
        setGuessedLetters(prev =>
            prev.includes(letter) ? prev : [...prev, letter]
        )
    }
    
    function useHint() {
        if (hints > 0 && !isGameOver) {
            const unguessedLetters = currentWord.split('').filter(letter => 
                !guessedLetters.includes(letter)
            )
            if (unguessedLetters.length > 0) {
                const hintLetter = unguessedLetters[0]
                addGuessedLetter(hintLetter)
                setHints(hints - 1)
                playSound(600, 0.15)
            }
        }
    }
    
    function usePowerUp(type) {
        if (powerUps[type] > 0 && !isGameOver) {
            if (type === 'reveal') {
                const hiddenLetters = currentWord.split('').filter(letter => 
                    !guessedLetters.includes(letter)
                ).slice(0, 2)
                hiddenLetters.forEach(letter => addGuessedLetter(letter))
            }
            
            setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }))
            playSound(800, 0.2)
        }
    }
    
    function startNewGame() {
        const gameTime = Date.now() - gameStartTime
        const wasFlawless = wrongGuessCount === 0 && isGameWon
        const wasClutch = wrongGuessCount === numGuessesLeft - 1 && isGameWon
        
        if (isGameWon) {
            const newStreak = streak + 1
            setStreak(newStreak)
            const updated = { 
                ...stats, 
                wins: stats.wins + 1,
                perfectGames: wasFlawless ? stats.perfectGames + 1 : stats.perfectGames,
                fastestWin: !stats.fastestWin || gameTime < stats.fastestWin ? gameTime : stats.fastestWin
            }
            localStorage?.setItem?.("gameStats", JSON.stringify(updated))
            setStats(updated)
            checkAchievements(true, gameTime, wasFlawless, wasClutch)
        } else if (isGameLost) {
            setStreak(0)
            const updated = { ...stats, losses: stats.losses + 1 }
            localStorage?.setItem?.("gameStats", JSON.stringify(updated))
            setStats(updated)
        }
        
        setCurrentWord(getRandomWord())
        setGuessedLetters([])
        setGameStartTime(Date.now())
        setTypingEffect('')
        setParticles([])
        
        // Restore some resources
        if (Math.random() > 0.5) setHints(Math.min(hints + 1, 3))
        if (Math.random() > 0.7) setPowerUps(prev => ({ 
            ...prev, 
            reveal: Math.min(prev.reveal + 1, 3) 
        }))
    }
    
    const themeClasses = {
        dark: 'theme-dark',
        cyberpunk: 'theme-cyberpunk',
        matrix: 'theme-matrix'
    }
    
    return (
        <main className={clsx(themeClasses[theme], shakeScreen && 'shake')}>
            {/* Particle Effects */}
            {particles.map(particle => (
                <div 
                    key={particle.id}
                    className="particle"
                    style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
                >
                    {particle.emoji}
                </div>
            ))}
            
            {/* Achievement Notification */}
            {showAchievement && (
                <div className="achievement-notification">
                    <div className="achievement-icon">{showAchievement.icon}</div>
                    <div>
                        <div className="achievement-name">{showAchievement.name}</div>
                        <div className="achievement-desc">{showAchievement.desc}</div>
                    </div>
                </div>
            )}
            
            {/* Confetti Effect */}
            {isGameWon && (
                <div className="confetti-container">
                    {Array.from({ length: 50 }, (_, i) => (
                        <div key={i} className="confetti-piece" style={{ 
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`
                        }} />
                    ))}
                </div>
            )}
            
            <header>
                <h1>Assembly: Endgame</h1>
                <div className="header-info">
                    <p>Guess the word within 8 attempts to keep the programming world safe!</p>
                    <div className="stats-row">
                        <span>Wins: {stats.wins}</span>
                        <span>Losses: {stats.losses}</span>
                        <span>Streak: {streak} 🔥</span>
                        <span>Perfect: {stats.perfectGames} 💎</span>
                    </div>
                </div>
                
                {/* Theme Switcher */}
                <div className="theme-switcher">
                    {['dark', 'cyberpunk', 'matrix'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={clsx('theme-btn', theme === t && 'active')}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </header>
            
            {/* Power-ups and Hints */}
            <section className="powerups">
                <button 
                    onClick={useHint}
                    disabled={hints === 0 || isGameOver}
                    className="powerup-btn hint-btn"
                >
                    💡 Hint ({hints})
                </button>
                <button 
                    onClick={() => usePowerUp('reveal')}
                    disabled={powerUps.reveal === 0 || isGameOver}
                    className="powerup-btn reveal-btn"
                >
                    🔍 Reveal 2 ({powerUps.reveal})
                </button>
                <div className="timer">
                    ⏱️ {Math.floor((Date.now() - gameStartTime) / 1000)}s
                </div>
            </section>
            
            <section className={clsx("game-status", {
                won: isGameWon,
                lost: isGameLost,
                farewell: !isGameOver && isLastGuessIncorrect
            })}>
                {!isGameOver && isLastGuessIncorrect && (
                    <p className="farewell-message">
                        {getFarewellText(languages[wrongGuessCount - 1].name)}
                    </p>
                )}
                
                {isGameWon && (
                    <div className="victory-message">
                        <h2>{typingEffect}</h2>
                        <p>Programming languages saved! 🎉</p>
                        <div className="game-stats">
                            <span>Time: {Math.floor((Date.now() - gameStartTime) / 1000)}s</span>
                            <span>Mistakes: {wrongGuessCount}</span>
                            {wrongGuessCount === 0 && <span className="perfect">PERFECT! 💎</span>}
                        </div>
                    </div>
                )}
                
                {isGameLost && (
                    <div className="defeat-message">
                        <h2>{typingEffect}</h2>
                        <p className="roast">{gameRoast}</p>
                        <a
                            href={`https://twitter.com/intent/tweet?text=I just lost at Assembly: Endgame! ${encodeURIComponent(gameRoast)} Try your luck: https://assembly-endgame.netlify.app`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tweet-button"
                        >
                            💀 Share the Pain
                        </a>
                    </div>
                )}
            </section>
            
            <section className="language-chips">
                {languages.map((lang, index) => {
                    const isLanguageLost = index < wrongGuessCount
                    return (
                        <span
                            className={clsx("chip", isLanguageLost && "lost")}
                            style={{
                                backgroundColor: lang.backgroundColor,
                                color: lang.color
                            }}
                            key={lang.name}
                        >
                            {lang.name}
                        </span>
                    )
                })}
            </section>
            
            <section className="word">
                {currentWord.split("").map((letter, index) => {
                    const shouldRevealLetter = isGameLost || guessedLetters.includes(letter)
                    const letterClassName = clsx(
                        "word-letter",
                        isGameLost && !guessedLetters.includes(letter) && "missed-letter",
                        shouldRevealLetter && "revealed"
                    )
                    return (
                        <span key={index} className={letterClassName}>
                            {shouldRevealLetter ? letter.toUpperCase() : ""}
                        </span>
                    )
                })}
            </section>
            
            <section className="keyboard">
                {alphabet.split("").map(letter => {
                    const isGuessed = guessedLetters.includes(letter)
                    const isCorrect = isGuessed && currentWord.includes(letter)
                    const isWrong = isGuessed && !currentWord.includes(letter)
                    const className = clsx("key", {
                        correct: isCorrect,
                        wrong: isWrong,
                        guessed: isGuessed
                    })
                    
                    return (
                        <button
                            className={className}
                            key={letter}
                            disabled={isGameOver || isGuessed}
                            onClick={() => addGuessedLetter(letter)}
                        >
                            {letter}
                        </button>
                    )
                })}
            </section>
            
            {isGameOver && (
                <button className="new-game" onClick={startNewGame}>
                    {isGameWon ? "⚡ Next Challenge" : "🔄 Try Again"}
                </button>
            )}
            
            {/* Achievements Panel */}
            <details className="achievements-panel">
                <summary>🏆 Achievements ({unlockedAchievements.length}/{achievements.length})</summary>
                <div className="achievements-grid">
                    {achievements.map(achievement => (
                        <div 
                            key={achievement.id}
                            className={clsx("achievement-item", {
                                unlocked: unlockedAchievements.includes(achievement.id)
                            })}
                        >
                            <span className="achievement-icon">{achievement.icon}</span>
                            <div>
                                <div className="achievement-name">{achievement.name}</div>
                                <div className="achievement-desc">{achievement.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </details>
        </main>
    )
}






















































