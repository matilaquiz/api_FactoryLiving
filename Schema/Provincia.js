/*const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const Provincia = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    id_provincia: { type: Number, unique: true, required: true },
    nombre: { type: String, required: true }
}, { _id: false });

LocalidadSchema.plugin(AutoIncrement, { id: 'provincia_seq', inc_field: 'id_provincia' });

const Localidad = mongoose.model('Localidad', Provincia);

module.exports = Localidad;*/

const mongoose = require('mongoose');

const provinciaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  id_provincia: {
    type: Number ,
    required: true
  }
  
});

module.exports = mongoose.model('Provincia', provinciaSchema);