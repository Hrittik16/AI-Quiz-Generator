document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const submitApiKeyBtn = document.getElementById('submitApiKey');
    const apiKeyInputGroup = document.querySelector('.api-key-input-group');
    const textInput = document.getElementById('textInput');
    const generateBtn = document.getElementById('generateBtn');
    const quizContainer = document.getElementById('quizContainer');
    const finishBtn = document.getElementById('finishBtn');
    const summaryContainer = document.getElementById('summaryContainer');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    const correctAnswersEl = document.getElementById('correctAnswers');
    const quizScoreEl = document.getElementById('quizScore');
    const quizChart = document.getElementById('quizChart');

    let quizData = null;
    let userAnswers = new Map();
    let chart = null;
    let apiKey = '';

    submitApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            alert('Please enter your OpenAI API key');
            return;
        }
        apiKey = key;
        apiKeyInputGroup.classList.add('hidden');
        setTimeout(() => {
            apiKeyInputGroup.style.display = 'none';
        }, 300);
    });

    generateBtn.addEventListener('click', async () => {
        const text = textInput.value.trim();

        if (!apiKey) {
            alert('Please enter your OpenAI API key first');
            apiKeyInputGroup.classList.remove('hidden');
            apiKeyInputGroup.style.display = 'flex';
            return;
        }

        if (!text) {
            alert('Please enter some text to generate a quiz');
            return;
        }

        try {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';

            const response = await fetch('/api/generate-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, apiKey }),
            });

            quizData = await response.json();

            if (response.ok) {
                displayQuiz(quizData);
                finishBtn.classList.remove('hidden');
                summaryContainer.classList.add('hidden');
            } else {
                throw new Error(quizData.error || 'Failed to generate quiz');
            }
        } catch (error) {
            alert(error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Quiz';
        }
    });

    function displayQuiz(quiz) {
        quizContainer.innerHTML = '';
        userAnswers.clear();
        
        quiz.questions.forEach((question, index) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question';
            
            const questionTitle = document.createElement('h3');
            questionTitle.textContent = `${index + 1}. ${question.question}`;
            
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options';
            
            question.options.forEach(option => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.textContent = option;
                
                optionElement.addEventListener('click', () => {
                    if (userAnswers.has(index)) return; // Prevent changing answer
                    
                    userAnswers.set(index, option);
                    
                    if (option === question.correctAnswer) {
                        optionElement.classList.add('correct');
                    } else {
                        optionElement.classList.add('incorrect');
                        // Find and highlight the correct answer
                        const correctOption = Array.from(optionsContainer.children)
                            .find(el => el.textContent === question.correctAnswer);
                        if (correctOption) {
                            correctOption.classList.add('correct');
                        }
                    }
                    
                    // Disable all options after selection
                    Array.from(optionsContainer.children).forEach(opt => {
                        opt.style.pointerEvents = 'none';
                    });
                });
                
                optionsContainer.appendChild(optionElement);
            });
            
            questionElement.appendChild(questionTitle);
            questionElement.appendChild(optionsContainer);
            quizContainer.appendChild(questionElement);
        });
    }

    finishBtn.addEventListener('click', () => {
        if (!quizData) return;

        const totalQuestions = quizData.questions.length;
        const correctAnswers = Array.from(userAnswers.entries())
            .filter(([index, answer]) => answer === quizData.questions[index].correctAnswer)
            .length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);

        // Update summary text
        totalQuestionsEl.textContent = totalQuestions;
        correctAnswersEl.textContent = correctAnswers;
        quizScoreEl.textContent = `${score}%`;

        // Create or update chart
        if (chart) {
            chart.destroy();
        }

        const ctx = quizChart.getContext('2d');
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect'],
                datasets: [{
                    data: [correctAnswers, totalQuestions - correctAnswers],
                    backgroundColor: [
                        'rgba(72, 187, 120, 0.8)',
                        'rgba(245, 101, 101, 0.8)'
                    ],
                    borderColor: [
                        'rgba(72, 187, 120, 1)',
                        'rgba(245, 101, 101, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Poppins',
                                size: 14
                            }
                        }
                    }
                }
            }
        });

        // Show summary
        summaryContainer.classList.remove('hidden');
        finishBtn.classList.add('hidden');
    });
}); 