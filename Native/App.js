// Importa AsyncStorage, que permite guardar información de forma persistente
// en el dispositivo, similar a localStorage en una aplicación web.
import AsyncStorage from '@react-native-async-storage/async-storage';


// Importa StatusBar desde Expo para controlar la apariencia
// de la barra superior del teléfono.
import { StatusBar } from 'expo-status-bar';


// Importa hooks de React.
// useEffect permite ejecutar código cuando ocurre un evento del ciclo de vida.
// useState permite manejar variables de estado dentro de los componentes.
import { useEffect, useState } from 'react';


// Importa los componentes que vamos a utilizar de React Native.
import {
  ActivityIndicator, // Muestra un indicador de carga.
  Alert,              // Permite mostrar ventanas de alerta.
  Pressable,          // Componente que puede ser presionado.
  SafeAreaView,       // Evita que el contenido choque con notch o barras del teléfono.
  ScrollView,         // Permite hacer scroll en la pantalla.
  StyleSheet,         // Permite definir estilos.
  Text,               // Permite mostrar texto.
  TextInput,          // Permite ingresar información.
  View                // Contenedor básico de React Native.
} from 'react-native';


// ======================================================
// CONSTANTES GENERALES
// ======================================================


// Nombre de la clave donde se almacenará el token del usuario.
const TOKEN_KEY = 'camisapp.token';


// Nombre de la clave donde se almacenará la URL de la API.
const URL_KEY = 'camisapp.apiUrl';


// Dirección predeterminada del backend.
// localhost funciona si la aplicación puede acceder al servidor local.
// En Expo Go normalmente será necesario utilizar la IP de la computadora.
const DEFAULT_URL = 'http://localhost:3000/api';


// Objeto que representa un diseño vacío de camiseta.
// Inicialmente todas las partes tienen color blanco.
const EMPTY = {
  torsoColor: '#ffffff',
  mangaIzqColor: '#ffffff',
  mangaDerColor: '#ffffff',
  cuelloColor: '#ffffff',
  rayaIzqColor: '#ffffff',
  rayaDerColor: '#ffffff'
};


// Arreglo que relaciona el nombre visible de cada parte
// con el atributo correspondiente dentro del objeto camiseta.
const PARTS = [
  ['Torso', 'torsoColor'],
  ['Manga izq.', 'mangaIzqColor'],
  ['Manga der.', 'mangaDerColor'],
  ['Cuello', 'cuelloColor'],
  ['Raya izq.', 'rayaIzqColor'],
  ['Raya der.', 'rayaDerColor']
];


// Lista de colores disponibles para diseñar la camiseta.
const COLORS = [
  '#ffffff', // Blanco.
  '#111827', // Negro/gris oscuro.
  '#ef4444', // Rojo.
  '#2563eb', // Azul.
  '#16a34a', // Verde.
  '#f59e0b', // Amarillo/naranja.
  '#9333ea', // Morado.
  '#ec4899'  // Rosa.
];


// Función auxiliar para obtener un mensaje de error.
// Si el error posee "message", lo devuelve.
// De lo contrario muestra un mensaje genérico.
const errorText = (e) =>
  e?.message || 'No fue posible conectar con el servidor.';


// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================


export default function App() {


  // Guarda el token JWT del usuario.
  // Inicialmente no existe token.
  const [token, setToken] = useState(null);


  // Guarda la dirección actual del backend.
  const [apiUrl, setApiUrl] = useState(DEFAULT_URL);


  // Indica si ya terminó de cargar la información almacenada.
  const [ready, setReady] = useState(false);


  // Controla si se muestra login o registro.
  const [screen, setScreen] = useState('login');


  // Controla la pestaña seleccionada dentro del dashboard.
  const [tab, setTab] = useState('design');


  // useEffect se ejecuta una vez cuando se carga App.
  useEffect(() => {


    // Se crea una función asíncrona y se ejecuta inmediatamente.
    (async () => {


      // Obtiene simultáneamente el token y la URL guardados
      // anteriormente en AsyncStorage.
      const [t, u] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(URL_KEY)
      ]);


      // Guarda en el estado el token recuperado.
      setToken(t);


      // Si existe una URL almacenada, reemplaza la URL predeterminada.
      if (u) {
        setApiUrl(u);
      }


      // Indica que la aplicación terminó de cargar
      // la configuración inicial.
      setReady(true);


    })();


  }, []);


  // Función que se ejecuta después de iniciar sesión.
  async function signIn(t) {


    // Guarda el token recibido en el almacenamiento del dispositivo.
    await AsyncStorage.setItem(TOKEN_KEY, t);


    // También guarda el token en el estado de React.
    setToken(t);
  }


  // Función utilizada para cerrar sesión.
  async function signOut() {


    // Elimina el token almacenado en el dispositivo.
    await AsyncStorage.removeItem(TOKEN_KEY);


    // Elimina el token del estado.
    setToken(null);


    // Regresa a la pantalla de login.
    setScreen('login');
  }


  // Guarda una nueva dirección para el servidor.
  async function saveUrl(value) {


    // Elimina "/" del final de la URL en caso de existir.
    const url = value.replace(/\/$/, '');


    // Guarda la URL en AsyncStorage.
    await AsyncStorage.setItem(URL_KEY, url);


    // Actualiza la URL dentro del estado.
    setApiUrl(url);
  }


  // Función general para realizar solicitudes HTTP al backend.
  async function request(path, options = {}) {


    // Realiza una petición utilizando fetch.
    const response = await fetch(
      `${apiUrl}${path}`,
      {
        // Copia las opciones recibidas.
        ...options,


        // Define los encabezados HTTP.
        headers: {


          // Indica que se enviarán datos JSON.
          'Content-Type': 'application/json',


          // Si la solicitud necesita autenticación y existe token,
          // agrega el encabezado Authorization.
          ...(options.auth !== false && token
            ? { Authorization: `Bearer ${token}` }
            : {}),


          // Agrega cualquier encabezado adicional recibido.
          ...options.headers
        }
      }
    );


    // Variable donde almacenaremos la respuesta JSON.
    let data;


    try {


      // Intenta convertir la respuesta del servidor a JSON.
      data = await response.json();


    } catch (_) {


      // Si el servidor no devuelve JSON, data queda en null.
      data = null;
    }


    // Si el servidor respondió con error HTTP...
    if (!response.ok) {


      // Genera un error utilizando primero el mensaje enviado
      // por el backend y, si no existe, el código HTTP.
      throw new Error(
        data?.error ||
        data?.mensaje ||
        `Error HTTP ${response.status}`
      );
    }


    // Devuelve los datos recibidos del backend.
    return data;
  }


  // Mientras se recupera AsyncStorage,
  // muestra únicamente un indicador de carga.
  if (!ready) {
    return (
      <SafeAreaView style={s.loader}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />
      </SafeAreaView>
    );
  }


  // Si no existe token significa que el usuario
  // todavía no ha iniciado sesión.
  if (!token) {
    return (
      <Auth
        screen={screen}
        setScreen={setScreen}
        request={request}
        signIn={signIn}
        apiUrl={apiUrl}
        saveUrl={saveUrl}
      />
    );
  }


  // Si existe token muestra el Dashboard.
  return (
    <Dashboard
      tab={tab}
      setTab={setTab}
      request={request}
      signOut={signOut}
      apiUrl={apiUrl}
      saveUrl={saveUrl}
    />
  );
}


// ======================================================
// AUTENTICACIÓN
// ======================================================


function Auth({
  screen,
  setScreen,
  request,
  signIn,
  apiUrl,
  saveUrl
}) {


  // Será true cuando la pantalla actual sea registro.
  const register = screen === 'register';


  // Guarda los datos ingresados en el formulario.
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    clave: ''
  });


  // Guarda posibles mensajes de error.
  const [error, setError] = useState('');


  // Indica si actualmente se está procesando una solicitud.
  const [busy, setBusy] = useState(false);


  // Función utilizada tanto para login como para registro.
  async function submit() {


    // Limpia errores anteriores.
    setError('');


    // Indica que comienza el procesamiento.
    setBusy(true);


    try {


      // Si estamos en la pantalla de registro...
      if (register) {


        // Envía los datos del formulario al endpoint /registro.
        await request('/registro', {
          method: 'POST',


          // El registro no requiere JWT.
          auth: false,


          // Convierte el objeto form a JSON.
          body: JSON.stringify(form)
        });


        // Informa que la cuenta fue creada.
        Alert.alert(
          'Cuenta creada',
          'Ahora puede iniciar sesión.'
        );


        // Cambia la interfaz nuevamente al login.
        setScreen('login');


      } else {


        // Si no estamos registrando,
        // realizamos el inicio de sesión.
        const d = await request('/login', {
          method: 'POST',


          // Login tampoco necesita token.
          auth: false,


          // Envía únicamente correo y contraseña.
          body: JSON.stringify({
            email: form.email,
            clave: form.clave
          })
        });


        // Guarda el token devuelto por el backend.
        await signIn(d.token);
      }


    } catch (e) {


      // Si ocurre algún problema,
      // guarda el mensaje para mostrarlo en pantalla.
      setError(errorText(e));


    } finally {


      // Sin importar si hubo éxito o error,
      // termina el estado de procesamiento.
      setBusy(false);
    }
  }


  // Interfaz de login y registro.
  return (
    <Page>


      {/* Permite configurar la dirección del backend. */}
      <ApiConfig
        apiUrl={apiUrl}
        saveUrl={saveUrl}
      />


      {/* Tarjeta que contiene el formulario. */}
      <View style={s.card}>


        {/* Cambia el título dependiendo de la pantalla. */}
        <Text style={s.title}>
          {register ? 'Crear cuenta' : 'Iniciar sesión'}
        </Text>


        {/* El campo nombre solamente aparece durante el registro. */}
        {register && (
          <Field
            label="Nombre"
            value={form.nombre}
            onChangeText={(nombre) =>
              setForm({
                ...form,
                nombre
              })
            }
          />
        )}


        {/* Campo de correo electrónico. */}
        <Field
          label="Correo electrónico"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(email) =>
            setForm({
              ...form,
              email
            })
          }
        />


        {/* Campo contraseña. */}
        <Field
          label="Contraseña"
          secureTextEntry
          value={form.clave}
          onChangeText={(clave) =>
            setForm({
              ...form,
              clave
            })
          }
        />


        {/* Muestra el error solamente si existe. */}
        {!!error && (
          <Text style={s.error}>
            {error}
          </Text>
        )}


        {/* Botón principal del formulario. */}
        <Button
          label={
            busy
              ? 'Procesando…'
              : register
                ? 'Registrarme'
                : 'Ingresar'
          }
          onPress={submit}
          disabled={busy}
        />


        {/* Permite cambiar entre login y registro. */}
        <Pressable
          onPress={() => {


            // Limpia errores anteriores.
            setError('');


            // Cambia la pantalla.
            setScreen(
              register
                ? 'login'
                : 'register'
            );
          }}
        >
          <Text style={s.link}>
            {register
              ? 'Ya tengo una cuenta'
              : 'No tengo cuenta: registrarme'}
          </Text>
        </Pressable>


      </View>


    </Page>
  );
}


// ======================================================
// DASHBOARD
// ======================================================


function Dashboard({
  tab,
  setTab,
  request,
  signOut,
  apiUrl,
  saveUrl
}) {


  return (
    <Page>


      {/* Encabezado principal. */}
      <View style={s.header}>


        {/* Nombre de la aplicación. */}
        <Text style={s.logo}>
          CamisApp
        </Text>


        {/* Botón para cerrar sesión. */}
        <Pressable onPress={signOut}>
          <Text style={s.link}>
            Salir
          </Text>
        </Pressable>


      </View>


      {/* Configuración compacta de la API. */}
      <ApiConfig
        apiUrl={apiUrl}
        saveUrl={saveUrl}
        compact
      />


      {/* Navegación mediante pestañas. */}
      <View style={s.tabs}>


        {/* Pestaña de diseños. */}
        <Tab
          label="Diseños"
          active={tab === 'design'}
          onPress={() => setTab('design')}
        />


        {/* Pestaña de votación. */}
        <Tab
          label="Votación"
          active={tab === 'vote'}
          onPress={() => setTab('vote')}
        />


      </View>


      {/* Dependiendo de la pestaña seleccionada
          muestra Diseños o Votación. */}
      {tab === 'design'
        ? <Design request={request} />
        : <Vote request={request} />
      }


    </Page>
  );
}


// ======================================================
// CRUD DE DISEÑOS
// ======================================================


function Design({ request }) {


  // Guarda el diseño que se está creando o modificando.
  const [design, setDesign] = useState(EMPTY);


  // Guarda todas las camisetas recibidas del backend.
  const [items, setItems] = useState([]);


  // Guarda el ID del diseño que se está editando.
  // null significa que estamos creando uno nuevo.
  const [editing, setEditing] = useState(null);


  // Guarda posibles errores.
  const [error, setError] = useState('');


  // Indica si actualmente se está guardando.
  const [busy, setBusy] = useState(false);


  // Carga todas las camisetas desde el backend.
  async function load() {


    try {


      // Limpia errores anteriores.
      setError('');


      // GET /camisetas.
      const camisetas = await request('/camisetas');


      // Guarda las camisetas recibidas.
      setItems(camisetas);


    } catch (e) {


      // Guarda el error.
      setError(errorText(e));
    }
  }


  // Cuando se carga el componente,
  // consulta automáticamente las camisetas.
  useEffect(() => {
    load();
  }, []);


  // Guarda o actualiza una camiseta.
  async function save() {


    // Activa el estado de carga.
    setBusy(true);


    try {


      // Si editing tiene un ID:
      // PUT /camisetas/:id
      //
      // Si editing es null:
      // POST /camisetas
      await request(
        editing
          ? `/camisetas/${editing}`
          : '/camisetas',
        {
          method: editing
            ? 'PUT'
            : 'POST',


          // Envía el diseño como JSON.
          body: JSON.stringify(design)
        }
      );


      // Reinicia el formulario.
      setDesign(EMPTY);


      // Sale del modo edición.
      setEditing(null);


      // Actualiza la lista.
      await load();


    } catch (e) {


      // Muestra posibles errores.
      setError(errorText(e));


    } finally {


      // Finaliza el estado de carga.
      setBusy(false);
    }
  }


  // Función utilizada para eliminar un diseño.
  function remove(id) {


    // Muestra una confirmación antes de eliminar.
    Alert.alert(
      'Eliminar diseño',
      'Esta acción no se puede deshacer.',
      [
        {
          // Primera opción: cancelar.
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          // Segunda opción: eliminar.
          text: 'Eliminar',
          style: 'destructive',


          // Se ejecuta si el usuario confirma.
          onPress: async () => {


            try {


              // DELETE /camisetas/:id
              await request(
                `/camisetas/${id}`,
                {
                  method: 'DELETE'
                }
              );


              // Recarga la lista.
              await load();


            } catch (e) {


              // Guarda cualquier error.
              setError(errorText(e));
            }
          }
        }
      ]
    );
  }


  return (
    <View>


      {/* Cambia el título dependiendo de si estamos editando. */}
      <Text style={s.title}>
        {editing
          ? 'Editar diseño'
          : 'Nuevo diseño'}
      </Text>


      {/* Texto informativo. */}
      <Text style={s.muted}>
        Elige los seis colores que recibe el backend.
      </Text>


      {/* Editor de colores de la camiseta. */}
      <ColorEditor
        design={design}
        setDesign={setDesign}
      />


      {/* Muestra errores. */}
      {!!error && (
        <Text style={s.error}>
          {error}
        </Text>
      )}


      {/* Botón para guardar o actualizar. */}
      <Button
        label={
          busy
            ? 'Guardando…'
            : editing
              ? 'Actualizar'
              : 'Guardar diseño'
        }
        onPress={save}
        disabled={busy}
      />


      {/* Este botón solamente aparece si estamos editando. */}
      {editing && (
        <Pressable
          onPress={() => {


            // Sale del modo edición.
            setEditing(null);


            // Limpia el diseño.
            setDesign(EMPTY);
          }}
        >
          <Text style={s.link}>
            Cancelar edición
          </Text>
        </Pressable>
      )}


      {/* Encabezado de la lista. */}
      <ListHeading
        onReload={load}
        label="Diseños guardados"
      />


      {/* Si existen camisetas las recorre con map(). */}
      {items.length
        ? items.map((item) => (


          <Shirt
            // React utiliza key para identificar cada elemento.
            key={item._id}


            // Envía la camiseta al componente.
            item={item}


            // Envía los botones disponibles.
            actions={
              <>


                {/* Botón editar. */}
                <Small
                  label="Editar"
                  onPress={() => {


                    // Guarda el ID de la camiseta.
                    setEditing(item._id);


                    // Copia los datos de la camiseta
                    // al formulario.
                    setDesign({
                      ...EMPTY,
                      ...item
                    });
                  }}
                />


                {/* Botón eliminar. */}
                <Small
                  label="Eliminar"
                  danger
                  onPress={() =>
                    remove(item._id)
                  }
                />


              </>
            }
          />


        ))


        // Si no existen camisetas muestra este mensaje.
        : (
          <Text style={s.muted}>
            No hay diseños cargados.
          </Text>
        )
      }


    </View>
  );
}


// ======================================================
// SISTEMA DE VOTACIÓN
// ======================================================


function Vote({ request }) {


  // Guarda las camisetas disponibles.
  const [items, setItems] = useState([]);


  // Guarda posibles errores.
  const [error, setError] = useState('');


  // Consulta las camisetas al backend.
  async function load() {


    try {


      // Limpia errores.
      setError('');


      // GET /camisetas.
      const camisetas = await request('/camisetas');


      // Actualiza el estado.
      setItems(camisetas);


    } catch (e) {


      // Guarda el error.
      setError(errorText(e));
    }
  }


  // Carga automáticamente los diseños
  // cuando aparece el componente.
  useEffect(() => {
    load();
  }, []);


  // Envía un voto al backend.
  async function vote(id, voto) {


    try {


      // PUT /camisetas/:id/votar
      const r = await request(
        `/camisetas/${id}/votar`,
        {
          method: 'PUT',


          // Envía voto 1 o -1.
          body: JSON.stringify({
            voto
          })
        }
      );


      // Actualiza solamente la camiseta votada.
      setItems(
        items.map((i) =>
          i._id === id


            // Si coincide el ID, actualiza calificación.
            ? {
                ...i,
                calificacion: r.calificacion
              }


            // Las demás camisetas permanecen iguales.
            : i
        )
      );


    } catch (e) {


      // Guarda posibles errores.
      setError(errorText(e));
    }
  }


  return (
    <View>


      {/* Encabezado de votación. */}
      <ListHeading
        onReload={load}
        label="Votación"
      />


      {/* Muestra errores. */}
      {!!error && (
        <Text style={s.error}>
          {error}
        </Text>
      )}


      {/* Recorre los diseños disponibles. */}
      {items.length
        ? items.map((item) => (


          <Shirt
            key={item._id}
            item={item}


            actions={
              <>


                {/* Suma un voto positivo. */}
                <Small
                  label="+1 Me gusta"
                  onPress={() =>
                    vote(item._id, 1)
                  }
                />


                {/* Envía un voto negativo. */}
                <Small
                  label="−1 No me gusta"
                  onPress={() =>
                    vote(item._id, -1)
                  }
                />


              </>
            }
          />


        ))
        : (
          <Text style={s.muted}>
            No hay diseños cargados.
          </Text>
        )
      }


    </View>
  );
}


// ======================================================
// CONFIGURACIÓN DEL SERVIDOR
// ======================================================


function ApiConfig({
  apiUrl,
  saveUrl,
  compact
}) {


  // Estado local para modificar la dirección.
  const [url, setUrl] = useState(apiUrl);


  return (
    <View
      style={
        compact
          ? s.configCompact
          : s.config
      }
    >


      {/* Título. */}
      <Text style={s.configTitle}>
        {compact
          ? 'Servidor API'
          : 'CamisApp · Servidor API'}
      </Text>


      {/* Entrada donde el usuario escribe la URL. */}
      <TextInput
        style={s.input}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />


      {/* Guarda la URL. */}
      <Button
        small
        label="Guardar URL"
        onPress={() =>
          saveUrl(url)
        }
      />


      {/* Explicación para utilizar Expo Go. */}
      <Text style={s.hint}>
        En Expo Go use la IP de su computadora,
        ej. http://192.168.1.10:3000/api
      </Text>


    </View>
  );
}


// ======================================================
// EDITOR DE COLORES
// ======================================================


function ColorEditor({
  design,
  setDesign
}) {


  return (
    <View style={s.colors}>


      {/* Recorre cada parte de la camiseta. */}
      {PARTS.map(([label, key]) => (


        <View
          key={key}
          style={s.colorRow}
        >


          {/* Nombre de la parte. */}
          <Text style={s.colorLabel}>
            {label}
          </Text>


          {/* Contenedor de colores disponibles. */}
          <View style={s.swatches}>


            {/* Recorre todos los colores. */}
            {COLORS.map((color) => (


              <Pressable
                key={color}


                // Cuando se presiona un color,
                // modifica solamente esa parte.
                onPress={() =>
                  setDesign({
                    ...design,
                    [key]: color
                  })
                }


                // Aplica el color visualmente.
                style={[
                  s.swatch,


                  {
                    backgroundColor: color
                  },


                  // Si es el color seleccionado,
                  // agrega el estilo selected.
                  design[key] === color &&
                    s.selected
                ]}
              />


            ))}


          </View>


        </View>


      ))}


    </View>
  );
}


// ======================================================
// TARJETA DE CAMISETA
// ======================================================


function Shirt({
  item,
  actions
}) {


  return (
    <View style={s.shirt}>


      {/* Encabezado de la tarjeta. */}
      <View style={s.cardHead}>


        <Text style={s.cardTitle}>
          Diseño
        </Text>


        {/* Si no existe calificación muestra cero. */}
        <Text style={s.score}>
          {item.calificacion ?? 0} pts
        </Text>


      </View>


      {/* Muestras de colores. */}
      <View style={s.samples}>


        {/* Recorre las seis partes. */}
        {PARTS.map(([label, key]) => (


          <View
            key={key}
            style={s.sample}
          >


            {/* Círculo con el color seleccionado. */}
            <View
              style={[
                s.dot,
                {
                  backgroundColor:
                    item[key] || '#fff'
                }
              ]}
            />


            {/* Nombre de la parte. */}
            <Text style={s.sampleText}>
              {label}
            </Text>


          </View>


        ))}


      </View>


      {/* ID generado por MongoDB. */}
      <Text
        style={s.id}
        numberOfLines={1}
      >
        {item._id}
      </Text>


      {/* Botones enviados desde el componente padre. */}
      <View style={s.actions}>
        {actions}
      </View>


    </View>
  );
}


// ======================================================
// COMPONENTES REUTILIZABLES
// ======================================================


// Componente que representa la estructura general de una pantalla.
function Page({ children }) {


  return (
    <SafeAreaView style={s.safe}>


      {/* Define la barra superior del dispositivo. */}
      <StatusBar style="dark" />


      {/* Permite desplazamiento vertical. */}
      <ScrollView
        contentContainerStyle={s.page}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>


    </SafeAreaView>
  );
}


// Componente reutilizable para campos de formulario.
function Field({
  label,
  ...props
}) {


  return (
    <View style={s.field}>


      {/* Etiqueta del campo. */}
      <Text style={s.label}>
        {label}
      </Text>


      {/* Recibe dinámicamente las propiedades restantes. */}
      <TextInput
        style={s.input}
        {...props}
      />


    </View>
  );
}


// Botón principal reutilizable.
function Button({
  label,
  onPress,
  disabled,
  small
}) {


  return (
    <Pressable


      // Deshabilita el botón cuando disabled sea true.
      disabled={disabled}


      // Función que se ejecutará al presionarlo.
      onPress={onPress}


      // Combina diferentes estilos.
      style={[
        s.button,
        small && s.smallButton,
        disabled && s.disabled
      ]}
    >


      {/* Texto del botón. */}
      <Text style={s.buttonText}>
        {label}
      </Text>


    </Pressable>
  );
}


// Botón secundario pequeño.
function Small({
  label,
  onPress,
  danger
}) {


  return (
    <Pressable
      onPress={onPress}


      // Si danger es true cambia el borde.
      style={[
        s.outline,
        danger && s.danger
      ]}
    >


      <Text
        style={[
          s.outlineText,
          danger && s.dangerText
        ]}
      >
        {label}
      </Text>


    </Pressable>
  );
}


// Componente utilizado para las pestañas.
function Tab({
  label,
  active,
  onPress
}) {


  return (
    <Pressable
      onPress={onPress}


      // Aplica estilo especial si está activa.
      style={[
        s.tab,
        active && s.tabActive
      ]}
    >


      <Text
        style={[
          s.tabText,
          active && s.tabTextActive
        ]}
      >
        {label}
      </Text>


    </Pressable>
  );
}


// Encabezado utilizado sobre las listas.
function ListHeading({
  label,
  onReload
}) {


  return (
    <View style={s.listHead}>


      {/* Nombre de la lista. */}
      <Text style={s.subtitle}>
        {label}
      </Text>


      {/* Permite consultar nuevamente el backend. */}
      <Pressable onPress={onReload}>
        <Text style={s.link}>
          Recargar
        </Text>
      </Pressable>


    </View>
  );
}


// ======================================================
// ESTILOS DE LA APLICACIÓN
// ======================================================


const s = StyleSheet.create({


  // Contenedor principal seguro.
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },


  // Pantalla utilizada mientras carga la aplicación.
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },


  // Contenido general de las pantallas.
  page: {
    padding: 20,
    paddingBottom: 48,
    gap: 16
  },


  // Encabezado principal.
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },


  // Logo o nombre CamisApp.
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a'
  },


  // Caja de configuración del servidor.
  config: {
    backgroundColor: '#e0f2fe',
    borderRadius: 14,
    padding: 16,
    gap: 8
  },


  // Versión pequeña de configuración.
  configCompact: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 12,
    gap: 6
  },


  // Título de configuración.
  configTitle: {
    fontWeight: '700',
    color: '#0c4a6e'
  },


  // Texto de ayuda.
  hint: {
    color: '#475569',
    fontSize: 12
  },


  // Tarjetas generales.
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: .08,
    shadowRadius: 8,
    elevation: 2
  },


  // Título principal.
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a'
  },


  // Subtítulo.
  subtitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a'
  },


  // Texto secundario.
  muted: {
    color: '#64748b'
  },


  // Contenedor de cada campo.
  field: {
    gap: 6
  },


  // Etiqueta del campo.
  label: {
    fontWeight: '600',
    color: '#334155'
  },


  // Entrada de texto.
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0f172a'
  },


  // Botón principal.
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
    marginTop: 2
  },


  // Variante pequeña del botón.
  smallButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 0
  },


  // Apariencia de controles deshabilitados.
  disabled: {
    opacity: .55
  },


  // Texto del botón principal.
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },


  // Estilo de enlaces.
  link: {
    color: '#2563eb',
    fontWeight: '700',
    marginTop: 4
  },


  // Mensajes de error.
  error: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8
  },


  // Contenedor de pestañas.
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 3
  },


  // Pestaña normal.
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8
  },


  // Pestaña seleccionada.
  tabActive: {
    backgroundColor: '#fff'
  },


  // Texto normal de pestaña.
  tabText: {
    color: '#475569',
    fontWeight: '700'
  },


  // Texto de pestaña activa.
  tabTextActive: {
    color: '#2563eb'
  },


  // Contenedor del selector de colores.
  colors: {
    marginVertical: 14,
    gap: 10
  },


  // Fila de cada parte de la camiseta.
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },


  // Nombre de cada parte.
  colorLabel: {
    width: 92,
    color: '#334155',
    fontSize: 13
  },


  // Contenedor de círculos de colores.
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    flex: 1
  },


  // Círculo individual de color.
  swatch: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#94a3b8'
  },


  // Color actualmente seleccionado.
  selected: {
    borderWidth: 3,
    borderColor: '#0f172a',
    transform: [
      {
        scale: 1.1
      }
    ]
  },


  // Encabezado de las listas.
  listHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8
  },


  // Tarjeta de cada camiseta.
  shirt: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },


  // Encabezado de tarjeta.
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },


  // Título de tarjeta.
  cardTitle: {
    fontWeight: '800',
    color: '#0f172a'
  },


  // Puntaje de la camiseta.
  score: {
    color: '#2563eb',
    fontWeight: '800'
  },


  // Contenedor de muestras de colores.
  samples: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },


  // Cada muestra individual.
  sample: {
    width: '30%',
    alignItems: 'center',
    gap: 3
  },


  // Círculo que representa el color.
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#94a3b8'
  },


  // Nombre pequeño de cada parte.
  sampleText: {
    fontSize: 10,
    color: '#64748b'
  },


  // ID de MongoDB.
  id: {
    color: '#94a3b8',
    fontSize: 11
  },


  // Contenedor de botones de acciones.
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },


  // Botón secundario.
  outline: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9
  },


  // Texto del botón secundario.
  outlineText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12
  },


  // Variante de peligro, utilizada para eliminar.
  danger: {
    borderColor: '#dc2626'
  },


  // Texto rojo utilizado para acciones peligrosas.
  dangerText: {
    color: '#dc2626'
  }


});
