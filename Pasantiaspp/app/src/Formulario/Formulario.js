import React, {useState} from 'react';
import {Button} from 'reactstrap';
import FuncionPaso from '../FuncionPaso/FuncionPaso';
import Alerta from '../Alerta/Alerta.js';

function Formulario({Paso, RUN}) {
  //Definición de constantes en donde se almacenará el alumno, el reglamento y si se debe o no mostrar el modal.
  const [reglamento, setReglamento] = useState({RUN_Alumno: RUN, Fecha: getCurrentDateString()});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTipo, setAlertTipo] = useState('');
  const [showButtons, setShowButtons] = useState(true);
    
  const handleReglamento = () => {
    Paso = Paso + 0.5;
    FuncionPaso(Paso, RUN);
    setShowButtons(false);
    setTimeout(() => {
      window.location.href = '/alumno';
    }, 3000);
  }

  const funcRechazar = () => {
    setTimeout(() => {
      window.location.href = '/alumno';
    }, 500);
  }

  //Función tipo POST para agregar un registro al la tabla de Reglamentos del backend
  const entregarDataReglamento = async () => {
    try {
      const respuesta = await fetch('/api/bd/crear/reglamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          RUN_Alumno: reglamento.RUN_Alumno,
          Fecha: reglamento.Fecha
        })
      })
      
      const data = await respuesta.json();
      
      if (data.error) {
        throw new Error(data.error);
      } else {
        setShowAlert(true);
        setAlertMessage('Reglamento aceptado exitosamente.');
        setAlertTipo('success');
        handleReglamento();
      }
    } catch (error){
      setShowAlert(true);
      setAlertMessage(error.message);
      setAlertTipo('danger');
    }
  }

  //Función para convertir un número en String y, en caso de tener un dígito (X), pasarlo al formato "0X" - Sirve para estandarizar el formato de DateTime.
  function convertNumberFormat(num) {
    if (num < 10){
      return ('0' + num.toString());
    }
    else{
      return (num.toString());
    }
  }
  
  //Genera un registro de el DateTime actual en formato "YYYY-MM-DD HH:mm:ss".
  function getCurrentDateString() {
    const day = new Date().getDate()
    const month = new Date().getMonth() + 1
    const year = new Date().getFullYear()
    const hours = new Date().getHours()
    const min = new Date().getMinutes()
    const sec = new Date().getSeconds()
    return (year.toString() + '-' + convertNumberFormat(month) + '-' + convertNumberFormat(day) + ' ' +  convertNumberFormat(hours) + ':' + convertNumberFormat(min) + ':' + convertNumberFormat(sec))
  }

  //Ejecuta todos los comandos que se deben ejecutar al momento de confirmar el reglamento
  const funcConfirmado = () => {
    //Almacenar la hora en que se aceptó
    setReglamento(prevState => ({
      ...prevState,
      ['Fecha']: getCurrentDateString()
    }));
    //Crear al alumno y al registro de reglamento en la BD.
    entregarDataReglamento();
  }
  
  //Se retorna el código HTML del Formulario que recibe la información del Alumno y genera sus registros en caso de aceptar el reglamento.
  return (
    <div className="center">
      <h1>Confirmación de reglamento</h1>
      <div>
        <embed
          src="http://localhost:4000/omega/pdf/DECRETO ACADEMICO REGLAMENTO FIC PRACTICA.pdf"
          width="800"
          height="575"
          type="application/pdf"
        />
        <div>
          {<Alerta mensaje = {alertMessage} tipo = {alertTipo} showAlert = {showAlert} setShowAlert = {setShowAlert}/>}
        </div>
        {showButtons ? (
          <div className="button-container">
            <Button className="accept-button" onClick={() => funcConfirmado()}>Aceptar</Button>
            <Button className="reject-button" onClick={() => funcRechazar()}>Rechazar</Button>
          </div>
        ) : (
          <div></div>
        )
        }
      </div>
  </div>
  );
}

export default Formulario;