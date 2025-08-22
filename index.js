
        // Math Question System
        class MathQuestionGenerator {
            constructor() {
                this.difficulty = 1;
                this.currentQuestion = null;
                this.currentAnswer = 0;
            }

            generateQuestion(level) {
                const operations = ['+', '-', '×', '÷'];
                let num1, num2, operation, answer, question;

                // Adjust difficulty based on level
                const maxNum = Math.min(5 + level * 2, 50);

                switch (level % 4) {
                    case 0: // Addition
                        num1 = Math.floor(Math.random() * maxNum) + 1;
                        num2 = Math.floor(Math.random() * maxNum) + 1;
                        operation = '+';
                        answer = num1 + num2;
                        question = `${num1} + ${num2}`;
                        break;

                    case 1: // Subtraction
                        num1 = Math.floor(Math.random() * maxNum) + 10;
                        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
                        operation = '-';
                        answer = num1 - num2;
                        question = `${num1} - ${num2}`;
                        break;

                    case 2: // Multiplication
                        num1 = Math.floor(Math.random() * Math.min(maxNum / 3, 12)) + 2;
                        num2 = Math.floor(Math.random() * Math.min(maxNum / 3, 12)) + 2;
                        operation = '×';
                        answer = num1 * num2;
                        question = `${num1} × ${num2}`;
                        break;

                    case 3: // Division
                        num2 = Math.floor(Math.random() * 8) + 2;
                        answer = Math.floor(Math.random() * 10) + 2;
                        num1 = num2 * answer;
                        operation = '÷';
                        question = `${num1} ÷ ${num2}`;
                        break;
                }

                // Generate wrong answers
                const options = [answer];
                while (options.length < 4) {
                    let wrongAnswer;
                    if (operation === '÷') {
                        wrongAnswer = answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
                    } else {
                        wrongAnswer = answer + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 1);
                    }

                    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
                        options.push(wrongAnswer);
                    }
                }

                // Shuffle options
                for (let i = options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [options[i], options[j]] = [options[j], options[i]];
                }

                this.currentQuestion = {
                    question: question + ' = ?',
                    options: options,
                    correctAnswer: answer,
                    correctIndex: options.indexOf(answer)
                };

                return this.currentQuestion;
            }
        }

        // Enhanced Block class
        class Block {
            constructor(block, index) {
                this.STATES = {
                    ACTIVE: 'active',
                    STOPPED: 'stopped',
                    MISSED: 'missed'
                };
                this.index = index;
                this.targetBlock = block;

                // Dimensions
                this.dimension = {
                    width: this.targetBlock ? this.targetBlock.dimension.width : 10,
                    height: 2,
                    depth: this.targetBlock ? this.targetBlock.dimension.depth : 10
                };

                // Position
                this.position = {
                    x: this.targetBlock ? this.targetBlock.position.x : 0,
                    y: this.dimension.height * this.index,
                    z: this.targetBlock ? this.targetBlock.position.z : 0
                };

                // Color based on index
                const hue = (this.index * 30) % 360;
                this.color = new THREE.Color().setHSL(hue / 360, 0.8, 0.6);

                // Create mesh
                const geometry = new THREE.BoxGeometry(
                    this.dimension.width,
                    this.dimension.height,
                    this.dimension.depth
                );

                const material = new THREE.MeshLambertMaterial({
                    color: this.color
                });

                this.mesh = new THREE.Mesh(geometry, material);
                this.mesh.position.set(this.position.x, this.position.y, this.position.z);

                // Add glow effect
                const glowGeometry = new THREE.BoxGeometry(
                    this.dimension.width * 1.1,
                    this.dimension.height * 1.1,
                    this.dimension.depth * 1.1
                );
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: this.color,
                    transparent: true,
                    opacity: 0.2
                });
                this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
                this.glowMesh.position.copy(this.mesh.position);
            }
        }

        // Enhanced Game class
        class Game {
            constructor() {
                this.STATES = {
                    READY: 'ready',
                    PLAYING: 'playing',
                    QUESTION: 'question',
                    ENDED: 'ended'
                };

                this.state = this.STATES.READY;
                this.score = 0;
                this.blocks = [];
                this.questionGenerator = new MathQuestionGenerator();

                this.initializeScene();
                this.initializeUI();
                this.animate();
            }

            initializeScene() {
                // Scene setup
                this.scene = new THREE.Scene();
                this.scene.fog = new THREE.Fog(0x667eea, 50, 200);

                // Camera
                const aspect = window.innerWidth / window.innerHeight;
                this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
                this.camera.position.set(15, 15, 15);
                this.camera.lookAt(0, 0, 0);

                // Renderer
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true
                });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setClearColor(0x667eea, 0);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

                document.getElementById('game').appendChild(this.renderer.domElement);

                // Lighting
                const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
                this.scene.add(ambientLight);

                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(20, 20, 20);
                directionalLight.castShadow = true;
                directionalLight.shadow.mapSize.width = 2048;
                directionalLight.shadow.mapSize.height = 2048;
                this.scene.add(directionalLight);

                // Add base platform
                this.addBaseBlock();

                // Window resize handler
                window.addEventListener('resize', () => this.onWindowResize());
            }

            initializeUI() {
                this.container = document.getElementById('container');
                this.scoreElement = document.getElementById('score-value');
                this.startButton = document.getElementById('start-button');
                this.tutorialButton = document.getElementById('tutorial-button');
                this.mathQuestion = document.getElementById('math-question');
                this.questionText = document.getElementById('question-text');
                this.answerButtons = document.querySelectorAll('.answer-btn');
                this.feedback = document.getElementById('feedback');
                this.finalScore = document.getElementById('final-score');
                this.finalBlocks = document.getElementById('final-blocks');

                this.startButton.addEventListener('click', () => this.startGame());
                this.tutorialButton.addEventListener('click', () => showTutorial());
            }

            addBaseBlock() {
                const baseBlock = new Block(null, 0);
                this.blocks.push(baseBlock);
                this.scene.add(baseBlock.mesh);
                this.scene.add(baseBlock.glowMesh);
            }

            startGame() {
                this.updateState(this.STATES.PLAYING);
                this.score = 0;
                this.updateScore();
                this.showQuestion();
                if (musicOn) lobbyMusic.play();
            }

            showQuestion() {
                this.updateState(this.STATES.QUESTION);
                const question = this.questionGenerator.generateQuestion(this.score);

                this.questionText.textContent = question.question;

                this.answerButtons.forEach((btn, index) => {
                    btn.textContent = question.options[index];
                    btn.className = 'answer-btn';
                    btn.disabled = false;
                });
            }

            selectAnswer(index) {
                const question = this.questionGenerator.currentQuestion;
                const isCorrect = index === question.correctIndex;

                // Disable all buttons
                this.answerButtons.forEach(btn => btn.disabled = true);

                // Show visual feedback
                if (isCorrect) {
                    this.answerButtons[index].classList.add('correct');
                    this.showFeedback('Benar! 🎉', 'correct');
                    if (musicOn) correctSound.play();
                    setTimeout(() => {
                        this.addBlock();
                        this.score++;
                        this.updateScore();
                        this.updateState(this.STATES.PLAYING);
                        setTimeout(() => this.showQuestion(), 3000);
                    }, 1500);
                } else {
                    if (musicOn) wrongSound.play();
                    this.answerButtons[index].classList.add('wrong');
                    this.answerButtons[question.correctIndex].classList.add('correct');
                    this.showFeedback('Salah! 😞', 'wrong');
                    setTimeout(() => {
                        this.endGame();
                    }, 2000);
                }
            }

            addBlock() {
                const newBlock = new Block(this.blocks[this.blocks.length - 1], this.blocks.length);
                this.blocks.push(newBlock);
                this.scene.add(newBlock.mesh);
                this.scene.add(newBlock.glowMesh);

                // Animate block appearance
                newBlock.mesh.position.y += 20;
                newBlock.glowMesh.position.y += 20;

                TweenLite.to(newBlock.mesh.position, 0.8, {
                    y: newBlock.position.y,
                    ease: Power2.easeOut
                });

                TweenLite.to(newBlock.glowMesh.position, 0.8, {
                    y: newBlock.position.y,
                    ease: Power2.easeOut
                });

                // Update camera
                this.updateCamera();
            }

            updateCamera() {
                const targetY = this.blocks.length * 3;
                TweenLite.to(this.camera.position, 1, {
                    y: Math.max(15, targetY),
                    ease: Power1.easeInOut
                });
            }

            showFeedback(message, type) {
                this.feedback.textContent = message;
                this.feedback.className = `feedback ${type}`;
                this.feedback.style.display = 'block';

                setTimeout(() => {
                    this.feedback.style.display = 'none';
                }, 1500);
            }

            updateScore() {
                this.scoreElement.textContent = this.score;
            }

            endGame() {
                this.updateState(this.STATES.ENDED);
                this.finalScore.textContent = this.score;
                this.finalBlocks.textContent = this.blocks.length - 1;
                lobbyMusic.pause();
                if (musicOn) GameOverSound.play();
            }

            restartGame() {
                // Clear blocks except base
                for (let i = 1; i < this.blocks.length; i++) {
                    this.scene.remove(this.blocks[i].mesh);
                    this.scene.remove(this.blocks[i].glowMesh);
                }
                this.blocks = this.blocks.slice(0, 1);

                // Reset camera
                this.camera.position.set(15, 15, 15);

                // Restart game
                this.startGame();
            }

            updateState(newState) {
                this.container.className = newState;
                this.state = newState;
            }

            onWindowResize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }

            animate() {
                requestAnimationFrame(() => this.animate());

                // Animate blocks
                this.blocks.forEach((block, index) => {
                    if (index > 0) {
                        block.mesh.rotation.y += 0.005;
                        block.glowMesh.rotation.y += 0.005;

                        // Floating animation
                        const time = Date.now() * 0.001;
                        block.mesh.position.y = block.position.y + Math.sin(time + index) * 0.1;
                        block.glowMesh.position.y = block.position.y + Math.sin(time + index) * 0.1;
                    }
                });

                this.renderer.render(this.scene, this.camera);
            }
        }

        // Tutorial functions
        function showTutorial() {
            document.getElementById('tutorial-modal').style.display = 'block';
        }

        function closeTutorial() {
            document.getElementById('tutorial-modal').style.display = 'none';
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('tutorial-modal');
            if (event.target === modal) {
                closeTutorial();
            }
        }

        // Close modal with Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeTutorial();
            }
        });

        // Global function for answer selection
        function selectAnswer(index) {
            game.selectAnswer(index);
        }

        // Initialize game
        const game = new Game();

        // === Music & Sound ===
        const lobbyMusic = new Audio('music/lobby-sound.mp3');
        lobbyMusic.loop = true;
        lobbyMusic.volume = 0.5;

        const correctSound = new Audio('music/right-answer-sound.wav');
        correctSound.volume = 0.8;

        const wrongSound = new Audio('music/wrong-answer.wav');
        wrongSound.volume = 0.8;

        const GameOverSound = new Audio('music/game-over.wav');
        GameOverSound.volume = 0.8;

        const hoverButtonSound = new Audio('music/hover-button.wav');
        hoverButtonSound.volume = 0.2;

        const clickButton = new Audio('music/click-button.wav');
        clickButton.volume = 0.8;

        let musicOn = true;
        const musicToggle = document.getElementById('music-toggle');

        // === Hover & Click Sound for All Buttons ===
        function attachButtonSounds() {
            const allButtons = document.querySelectorAll("button, #start-button, #tutorial-button, .game-buttons>div");
            allButtons.forEach(btn => {
                btn.addEventListener("mouseenter", () => {
                    if (musicOn) {
                        hoverButtonSound.currentTime = 0;
                        hoverButtonSound.play();
                    }
                });
                btn.addEventListener("click", () => {
                    if (musicOn) {
                        clickButton.currentTime = 0;
                        clickButton.play();
                    }
                });
            });
        }

        attachButtonSounds();


        // === Tutorial Modal System ===
       

        // === Fix Redirect Button (karena window.href salah, harus window.location.href) ===
        document.querySelector(".redirect-btn").addEventListener("click", () => {
            window.location.href = "https://hafidzfurqon.serv00.net/";
        });


        musicToggle.addEventListener('click', () => {
            musicOn = !musicOn;
            if (musicOn) {
                lobbyMusic.play();
                musicToggle.textContent = '🔊';
            } else {
                lobbyMusic.pause();
                musicToggle.textContent = '🔇';
            }
        });
    