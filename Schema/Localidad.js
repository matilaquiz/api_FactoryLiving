const mongoose = require('mongoose');

const localidadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  provincia: {
    type: Number,  
  },
  provincia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provincia',
    required: true
  }
});

module.exports = mongoose.model('Localidad', localidadSchema);