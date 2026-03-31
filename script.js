document.addEventListener('DOMContentLoaded', () => {
    // Scroll Animation Logic
    const canvas = document.getElementById('animation-canvas');
    const context = canvas.getContext('2d');
    const scrollSection = document.getElementById('scroll-section');
    const mainContent = document.getElementById('main-content');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    const scrollPrompt = document.getElementById('scroll-prompt');

    const frameCount = 151;
    const currentFrame = index => (
        `frames/ezgif-frame-${index.toString().padStart(3, '0')}.png`
    );

    const images = [];
    let imagesLoaded = 0;

    const preloadImages = () => {
        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            img.onload = () => {
                imagesLoaded++;
                const progress = Math.floor((imagesLoaded / frameCount) * 100);
                loaderBar.style.width = `${progress}%`;
                loaderText.innerText = `Growing your world... ${progress}%`;

                if (imagesLoaded === frameCount) {
                    setTimeout(() => {
                        loadingOverlay.style.opacity = '0';
                        setTimeout(() => {
                            loadingOverlay.style.display = 'none';
                        }, 800);
                    }, 500);
                }
            };
            images[i] = img;
        }
    };

    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        render(1);
    };

    const render = (index) => {
        if (images[index]) {
            const img = images[index];
            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (canvasAspect > imgAspect) {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgAspect;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                drawWidth = canvas.height * imgAspect;
                drawHeight = canvas.height;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
    };

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const maxScroll = scrollSection.offsetHeight - window.innerHeight;
        const scrollFraction = scrollTop / maxScroll;

        const frameIndex = Math.min(
            frameCount,
            Math.max(1, Math.floor(scrollFraction * frameCount))
        );

        requestAnimationFrame(() => render(frameIndex));

        if (scrollFraction >= 0.9) {
            const transitionProgress = (scrollFraction - 0.9) * 10;
            const opacity = Math.max(0, 1 - transitionProgress);
            requestAnimationFrame(() => render(frameCount));
            canvas.style.opacity = opacity;
            scrollPrompt.style.opacity = opacity;
            mainContent.style.opacity = 1;
            if (opacity <= 0) {
                canvas.style.visibility = 'hidden';
            } else {
                canvas.style.visibility = 'visible';
            }
        } else {
            canvas.style.opacity = '1';
            canvas.style.visibility = 'visible';
            scrollPrompt.style.opacity = '1';
            mainContent.style.opacity = '0';
            const frameIndex = Math.min(
                frameCount,
                Math.max(1, Math.floor(scrollFraction * frameCount))
            );
            requestAnimationFrame(() => render(frameIndex));
        }

        if (scrollTop > 50) {
            scrollPrompt.style.display = 'none';
        } else {
            scrollPrompt.style.display = 'block';
        }
    });

    window.addEventListener('resize', setCanvasSize);
    preloadImages();
    setCanvasSize();

    let currentStep = 1;
    const totalSteps = 5;
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');
    const stepPanes = document.querySelectorAll('.step-pane');
    const stepLabels = document.querySelectorAll('.step-label');
    const currentPriceEl = document.getElementById('current-price');
    const finalPriceEl = document.getElementById('final-price');
    const summaryEl = document.getElementById('order-summary');
    const warningEl = document.getElementById('comp-warning');
    const addToCartBtn = document.getElementById('add-to-cart');

    const selections = {
        container: { name: 'Globe', price: 299 },
        plants: [],
        layers: [],
        decorations: [],
        giftMessage: ''
    };

    const updateUI = () => {
        stepPanes.forEach((pane, index) => {
            pane.classList.toggle('active', index + 1 === currentStep);
        });
        stepLabels.forEach((label, index) => {
            label.classList.toggle('active', index + 1 === currentStep);
        });
        progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
        prevBtn.disabled = currentStep === 1;
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            generateSummary();
        } else {
            nextBtn.style.display = 'block';
            nextBtn.innerText = 'Next';
        }
        calculatePrice();
    };

    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            currentStep++;
            updateUI();
            window.scrollTo({ top: document.getElementById('customizer').offsetTop - 100, behavior: 'smooth' });
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateUI();
            window.scrollTo({ top: document.getElementById('customizer').offsetTop - 100, behavior: 'smooth' });
        }
    });

    document.querySelectorAll('input[name="container"]').forEach(input => {
        input.addEventListener('change', (e) => {
            selections.container = {
                name: e.target.value,
                price: parseInt(e.target.dataset.price)
            };
            calculatePrice();
        });
    });

    const handleCheckboxGroup = (name, targetArray) => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
            input.addEventListener('change', (e) => {
                const item = {
                    name: e.target.value,
                    price: parseInt(e.target.dataset.price),
                    type: e.target.dataset.type || null
                };
                if (e.target.checked) {
                    selections[targetArray].push(item);
                } else {
                    selections[targetArray] = selections[targetArray].filter(i => i.name !== item.name);
                }
                if (name === 'plants') checkCompatibility();
                calculatePrice();
            });
        });
    };

    handleCheckboxGroup('plants', 'plants');
    handleCheckboxGroup('layers', 'layers');
    handleCheckboxGroup('decorations', 'decorations');

    document.getElementById('gift-message').addEventListener('input', (e) => {
        selections.giftMessage = e.target.value;
    });

    const checkCompatibility = () => {
        const types = selections.plants.map(p => p.type);
        const hasSucculent = types.includes('succulent');
        const hasTropical = types.includes('tropical');
        if (hasSucculent && hasTropical) {
            warningEl.innerText = "⚠️ Careful! Succulents and Tropical plants have different water needs and may not thrive together.";
        } else {
            warningEl.innerText = "";
        }
    };

    const calculatePrice = () => {
        let total = selections.container.price;
        total += selections.plants.reduce((sum, p) => sum + p.price, 0);
        total += selections.layers.reduce((sum, l) => sum + l.price, 0);
        total += selections.decorations.reduce((sum, d) => sum + d.price, 0);
        currentPriceEl.innerText = `₹${total}`;
        if (finalPriceEl) finalPriceEl.innerText = `₹${total}`;
    };

    const generateSummary = () => {
        let summaryHTML = `
            <div class="summary-item">
                <span><strong>Container:</strong> ${selections.container.name}</span>
                <span>₹${selections.container.price}</span>
            </div>
        `;
        if (selections.plants.length > 0) {
            summaryHTML += `<div class="summary-item"><span><strong>Plants:</strong></span></div>`;
            selections.plants.forEach(p => {
                summaryHTML += `<div class="summary-item" style="padding-left: 20px;"><span>${p.name}</span><span>₹${p.price}</span></div>`;
            });
        }
        if (selections.layers.length > 0) {
            summaryHTML += `<div class="summary-item"><span><strong>Layers:</strong></span></div>`;
            selections.layers.forEach(l => {
                summaryHTML += `<div class="summary-item" style="padding-left: 20px;"><span>${l.name}</span><span>₹${l.price}</span></div>`;
            });
        }
        if (selections.decorations.length > 0) {
            summaryHTML += `<div class="summary-item"><span><strong>Decorations:</strong></span></div>`;
            selections.decorations.forEach(d => {
                summaryHTML += `<div class="summary-item" style="padding-left: 20px;"><span>${d.name}</span><span>₹${d.price}</span></div>`;
            });
        }
        if (selections.giftMessage) {
            summaryHTML += `<div class="summary-item" style="margin-top: 20px;"><span><strong>Gift Message:</strong></span><span style="font-style: italic;">"${selections.giftMessage}"</span></div>`;
        }
        summaryEl.innerHTML = summaryHTML;
    };

    addToCartBtn.addEventListener('click', () => {
        addToCartBtn.innerText = "✓ Added to Cart";
        addToCartBtn.style.background = "#2ecc71";
        addToCartBtn.disabled = true;
        setTimeout(() => {
            alert("Order placed successfully! (Demo Only)");
            location.reload();
        }, 1500);
    });

    document.querySelectorAll('.nav-links a, .logo').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    updateUI();
});
