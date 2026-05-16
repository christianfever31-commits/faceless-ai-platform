/**
 * Faceless AI - Animated Particles Background
 * Creates an interactive particle system with AI theme
 */

class ParticleSystem {
  constructor(canvasId = 'particle-canvas') {
    this.canvas = document.getElementById(canvasId);
    
    // Create canvas if it doesn't exist
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = canvasId;
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.zIndex = '-1';
      document.body.appendChild(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.connections = [];
    this.mouse = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.particleCount = 50;
    this.connectionDistance = 150;
    
    this.init();
    this.animate();
    this.attachEventListeners();
  }

  init() {
    this.resizeCanvas();
    this.createParticles();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    
    for (let i = 0; i < this.particleCount; i++) {
      const particle = {
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        color: this.getRandomColor(),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.05 + 0.01
      };
      this.particles.push(particle);
    }
  }

  getRandomColor() {
    const colors = ['#6ae2ff', '#9b5cff', '#00c6ff', '#a78bfa', '#4dd0e1'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updateParticles() {
    for (let particle of this.particles) {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;

      // Apply gravity towards mouse
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 200) {
        const force = 0.0005;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }

      // Damping
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Pulse effect
      particle.pulsePhase += particle.pulseSpeed;
      particle.opacity = 0.3 + 0.3 * Math.sin(particle.pulsePhase);
    }
  }

  drawParticles() {
    for (let particle of this.particles) {
      this.ctx.fillStyle = this.hexToRgba(particle.color, particle.opacity);
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = particle.color;
      
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.shadowBlur = 0;
  }

  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        if (distance < this.connectionDistance) {
          const opacity = (1 - distance / this.connectionDistance) * 0.2;
          this.ctx.strokeStyle = `rgba(106, 226, 255, ${opacity})`;
          this.ctx.lineWidth = 1;
          
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
  }

  drawMouseConnection() {
    for (let particle of this.particles) {
      const distance = Math.hypot(this.mouse.x - particle.x, this.mouse.y - particle.y);
      
      if (distance < 200) {
        const opacity = (1 - distance / 200) * 0.4;
        this.ctx.strokeStyle = `rgba(155, 92, 255, ${opacity})`;
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouse.x, this.mouse.y);
        this.ctx.lineTo(particle.x, particle.y);
        this.ctx.stroke();
      }
    }
  }

  drawMouseParticle() {
    // Draw glowing circle at mouse position
    const gradient = this.ctx.createRadialGradient(
      this.mouse.x, this.mouse.y, 0,
      this.mouse.x, this.mouse.y, 50
    );
    gradient.addColorStop(0, 'rgba(155, 92, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(155, 92, 255, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(
      this.mouse.x - 50,
      this.mouse.y - 50,
      100,
      100
    );

    // Draw center dot
    this.ctx.fillStyle = '#9b5cff';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#9b5cff';
    this.ctx.beginPath();
    this.ctx.arc(this.mouse.x, this.mouse.y, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  animate() {
    // Clear canvas with fade effect
    this.ctx.fillStyle = 'rgba(5, 8, 22, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.updateParticles();
    this.drawConnections();
    this.drawMouseConnection();
    this.drawParticles();
    this.drawMouseParticle();

    requestAnimationFrame(() => this.animate());
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  attachEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    // Reduce particle count on mobile
    if (window.innerWidth < 768) {
      this.particleCount = 30;
      this.particles = [];
      this.createParticles();
    }
  }

  setParticleCount(count) {
    this.particleCount = count;
    this.createParticles();
  }

  setConnectionDistance(distance) {
    this.connectionDistance = distance;
  }

  addParticles(count) {
    for (let i = 0; i < count; i++) {
      const particle = {
        x: this.mouse.x || Math.random() * this.canvas.width,
        y: this.mouse.y || Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.7 + 0.3,
        color: this.getRandomColor(),
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.05 + 0.01
      };
      this.particles.push(particle);
    }
  }

  removeParticles(count) {
    this.particles.splice(0, count);
  }

  clearParticles() {
    this.particles = [];
  }

  getParticleCount() {
    return this.particles.length;
  }
}

// Initialize particle system on page load
document.addEventListener('DOMContentLoaded', () => {
  const particleSystem = new ParticleSystem();
  
  // Expose to global scope for access
  window.particleSystem = particleSystem;
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParticleSystem;
}