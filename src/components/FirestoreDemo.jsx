// src/components/FirestoreDemo.jsx
// Demo component to showcase Firestore integration with guias, formulas, and categories
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import {
  createGuia,
  deleteGuia,
  subscribeToGuias,
} from '../lib/data/guias';
import {
  createFormula,
  deleteFormula,
  subscribeToFormulas,
} from '../lib/data/formulas';
import {
  createCategory,
  deleteCategory,
  subscribeToCategories,
} from '../lib/data/categories';

export default function FirestoreDemo() {
  const [guias, setGuias] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newGuia, setNewGuia] = useState({ title: '', content: '', slug: '', isPublished: false });
  const [newFormula, setNewFormula] = useState({ name: '', expression: '', description: '', isActive: true });
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', isActive: true, order: 0 });

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribeGuias = subscribeToGuias((data) => {
      setGuias(data);
      setLoading(false);
    });

    const unsubscribeFormulas = subscribeToFormulas((data) => {
      setFormulas(data);
    });

    const unsubscribeCategories = subscribeToCategories((data) => {
      setCategories(data);
    });

    return () => {
      unsubscribeGuias();
      unsubscribeFormulas();
      unsubscribeCategories();
    };
  }, []);

  const handleCreateGuia = async () => {
    if (!newGuia.title.trim()) {
      alert('Title is required');
      return;
    }
    try {
      await createGuia(newGuia);
      setNewGuia({ title: '', content: '', slug: '', isPublished: false });
    } catch (err) {
      console.error('Error creating guide:', err);
      alert('Error creating guide: ' + err.message);
    }
  };

  const handleCreateFormula = async () => {
    if (!newFormula.name.trim()) {
      alert('Name is required');
      return;
    }
    try {
      await createFormula(newFormula);
      setNewFormula({ name: '', expression: '', description: '', isActive: true });
    } catch (err) {
      console.error('Error creating formula:', err);
      alert('Error creating formula: ' + err.message);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Name is required');
      return;
    }
    try {
      await createCategory(newCategory);
      setNewCategory({ name: '', slug: '', isActive: true, order: 0 });
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Error creating category: ' + err.message);
    }
  };

  const handleDeleteGuia = async (id) => {
    if (window.confirm('Are you sure you want to delete this guide?')) {
      try {
        await deleteGuia(id);
      } catch (err) {
        console.error('Error deleting guide:', err);
        alert('Error deleting guide: ' + err.message);
      }
    }
  };

  const handleDeleteFormula = async (id) => {
    if (window.confirm('Are you sure you want to delete this formula?')) {
      try {
        await deleteFormula(id);
      } catch (err) {
        console.error('Error deleting formula:', err);
        alert('Error deleting formula: ' + err.message);
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(id);
      } catch (err) {
        console.error('Error deleting category:', err);
        alert('Error deleting category: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <StorageIcon sx={{ fontSize: 40, color: '#87fcd9' }} />
        <Typography variant="h4" sx={{ color: 'white' }}>
          Firestore <span style={{ color: '#87fcd9' }}>Database</span>
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* GUIAS SECTION */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#87fcd9' }}>
              Guías ({guias.length})
            </Typography>
            
            {/* Create Form */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(135, 252, 217, 0.05)', borderRadius: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Title"
                value={newGuia.title}
                onChange={(e) => setNewGuia({ ...newGuia, title: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                label="Slug"
                value={newGuia.slug}
                onChange={(e) => setNewGuia({ ...newGuia, slug: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Content"
                value={newGuia.content}
                onChange={(e) => setNewGuia({ ...newGuia, content: e.target.value })}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newGuia.isPublished}
                    onChange={(e) => setNewGuia({ ...newGuia, isPublished: e.target.checked })}
                  />
                }
                label="Published"
                sx={{ mb: 1 }}
              />
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateGuia}
              >
                Add Guide
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* List */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              {guias.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No guides yet. Create one above!
                </Typography>
              ) : (
                guias.map((guia) => (
                  <Card key={guia.id} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {guia.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {guia.slug}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={guia.isPublished ? 'Published' : 'Draft'}
                          size="small"
                          color={guia.isPublished ? 'success' : 'default'}
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteGuia(guia.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* FORMULAS SECTION */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#87fcd9' }}>
              Fórmulas ({formulas.length})
            </Typography>
            
            {/* Create Form */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(135, 252, 217, 0.05)', borderRadius: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={newFormula.name}
                onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                label="Expression"
                value={newFormula.expression}
                onChange={(e) => setNewFormula({ ...newFormula, expression: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="Description"
                value={newFormula.description}
                onChange={(e) => setNewFormula({ ...newFormula, description: e.target.value })}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newFormula.isActive}
                    onChange={(e) => setNewFormula({ ...newFormula, isActive: e.target.checked })}
                  />
                }
                label="Active"
                sx={{ mb: 1 }}
              />
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateFormula}
              >
                Add Formula
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* List */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              {formulas.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No formulas yet. Create one above!
                </Typography>
              ) : (
                formulas.map((formula) => (
                  <Card key={formula.id} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {formula.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {formula.expression}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={formula.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={formula.isActive ? 'success' : 'default'}
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteFormula(formula.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* CATEGORIES SECTION */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#87fcd9' }}>
              Categorías ({categories.length})
            </Typography>
            
            {/* Create Form */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(135, 252, 217, 0.05)', borderRadius: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                label="Slug"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Order"
                value={newCategory.order}
                onChange={(e) => setNewCategory({ ...newCategory, order: parseInt(e.target.value) || 0 })}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newCategory.isActive}
                    onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                  />
                }
                label="Active"
                sx={{ mb: 1 }}
              />
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateCategory}
              >
                Add Category
              </Button>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* List */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              {categories.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No categories yet. Create one above!
                </Typography>
              ) : (
                categories.map((category) => (
                  <Card key={category.id} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {category.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {category.slug} • Order: {category.order}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={category.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={category.isActive ? 'success' : 'default'}
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
