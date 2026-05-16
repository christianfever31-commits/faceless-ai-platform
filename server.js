const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// In-memory database (replace with real DB)
const projects = new Map();
const users = new Map();

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const userId = Math.random().toString(36).substr(2, 9);
    const user = { userId, email, name, createdAt: new Date() };
    users.set(email, user);

    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { userId, email, name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { userId: user.userId, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Generation Endpoints
app.post('/api/generate/prompt', authenticateToken, (req, res) => {
  try {
    const { prompt, projectType, settings } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const generationId = Math.random().toString(36).substr(2, 9);
    const result = {
      generationId,
      prompt,
      projectType: projectType || 'website',
      status: 'processing',
      createdAt: new Date(),
      userId: req.user.userId,
      settings: settings || {}
    };

    // Simulate AI processing
    setTimeout(() => {
      result.status = 'completed';
      result.output = generateMockOutput(prompt, projectType);
      result.completedAt = new Date();
    }, 2000);

    res.status(202).json({
      success: true,
      message: 'Generation started',
      generationId,
      estimatedTime: '2-5 seconds'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/create', authenticateToken, (req, res) => {
  try {
    const { name, description, type, template } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectId = Math.random().toString(36).substr(2, 9);
    const project = {
      projectId,
      name,
      description: description || '',
      type: type || 'website',
      template: template || 'blank',
      userId: req.user.userId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      files: [],
      deployments: []
    };

    projects.set(projectId, project);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects', authenticateToken, (req, res) => {
  try {
    const userProjects = Array.from(projects.values())
      .filter(p => p.userId === req.user.userId);

    res.json({
      success: true,
      count: userProjects.length,
      projects: userProjects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:projectId', authenticateToken, (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectId', authenticateToken, (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    if (name) project.name = name;
    if (description) project.description = description;
    project.updatedAt = new Date();

    projects.set(projectId, project);

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:projectId', authenticateToken, (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    projects.delete(projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/deploy', authenticateToken, (req, res) => {
  try {
    const { projectId } = req.params;
    const project = projects.get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const deploymentId = Math.random().toString(36).substr(2, 9);
    const deployment = {
      deploymentId,
      projectId,
      status: 'deploying',
      url: `https://${project.name.replace(/\s+/g, '-')}-${deploymentId}.facelessai.app`,
      createdAt: new Date()
    };

    project.deployments.push(deployment);

    // Simulate deployment
    setTimeout(() => {
      deployment.status = 'live';
    }, 3000);

    res.status(202).json({
      success: true,
      message: 'Deployment started',
      deployment,
      estimatedTime: '3-5 seconds'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate mock AI output
function generateMockOutput(prompt, type) {
  const outputs = {
    website: {
      html: '<!DOCTYPE html><html><head><title>Generated Site</title></head><body><h1>Welcome</h1></body></html>',
      css: 'body { font-family: Arial; margin: 0; padding: 20px; }',
      description: 'Generated website based on your prompt'
    },
    app: {
      framework: 'React',
      components: ['Header', 'Dashboard', 'Navigation'],
      description: 'Mobile app template generated'
    },
    game: {
      engine: 'Babylon.js',
      description: '3D game scene generated',
      assets: ['Player', 'Environment', 'UI']
    }
  };

  return outputs[type] || outputs.website;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Faceless AI Backend Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;