
const express = require('express');
const app=express();
const port=3000;
const cors = require('cors')







clientes = [
    {    key:1,
        dni:4343444,
        nombre:"juan",
        apellido:"perez",
        calle: "los narnajos",
        numero: 555,
        dpto:"",
        barrio:"providencia",
        provincia:"salta",
        localidad:"new old",
        telefono:351340022,
        email:"jua@fgamil.com"},
    {
        key:2,
        dni:5543444,
        nombre:"pedro",
        apellido:"gonzales",
        calle: "los parapap",
        numero: 45,
        dpto:"",
        barrio:"letraso",
        provincia:"santa fe",
        localidad:"ol spaice",
        telefono:353555555,
        email:"pedrito@fgamil.com"
   },
    {
        key:3,
        dni:43678965,
        nombre:"mati",
        apellido:"ere",
        calle: "anacreonte",
        numero: 282,
        dpto:"",
        barrio:"alta cba",
        provincia:"cordoba",
        localidad:"capital",
        telefono:35138888,
        email:"matiaslaquiz@fgamil.com"
   },
    
]
app.use(express.json())

app.use(express.urlencoded({ extended: true }));
app.use(cors())





app.get('/tareas', (req, res) => {
    res.json(clientes);
  });
  
app.post('/tareas', (req, res) => {
    const nuevoCliente = req.body;
    clientes.push(nuevoCliente);
    res.json(nuevoCliente);
  });

  app.delete('/tareas/:id', (req, res) => {
    const { id } = req.params;
    clientes = clientes.filter(cliente => cliente.key !== parseInt(id));
    res.status(204).send();
});


app.listen(port,()=>{
    console.log("server ok")
})

