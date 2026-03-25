# Correo Argentino: API MiCorreo

La API de MiCorreo se utiliza principalmente para cotizar envíos, e importarlos en la plataforma de MiCorreo.

Esta API está organizada en torno a REST. Nuestra API tiene direcciones URL predecibles orientadas a los
recursos, acepta solicitudes 'form-encoded', devuelve respuestas 'JSON-encode' y utiliza códigos de
respuesta, autenticación y verbos HTTP estándar.

## URL Base

Todas las URLs referenciadas en esta documentación corresponden a la siguiente base:

### Ambiente DEV (Desarrollo)

### Local

```
http://app-correoargintercotizador-dev.apps.ocpbarr.correo.local
```
### Ambiente QA (Testing)

### Local

```
http://app-correoargintercotizador-test.apps.ocpbarr.correo.local
```
### Exteriorizada

```
https://apitest.correoargentino.com.ar/micorreo/v1
```
### Ambiente Productivo

### Local

```
http://app-correoargintercotizador.apps.ocpprod.correo.local
```
### Exteriorizada

```
https://api.correoargentino.com.ar/micorreo/v1
```

```
La API se sirve a través de HTTPS. Para garantizar la privacidad de los datos, no se admite HTTP sin
cifrar.
```
## Autentificación

La API de MiCorreo utiliza JWT tokens para autorizar las solicitudes. Para obtener el token de autorización
deberán previamente autentificarse a través de HTTP Basic Auth. Las credenciales de acceso deberán ser
solicitadas a Correo para cada uno de los ambientes.

Request

```
curl -X POST ${BASE_URL}/token -u ${user}:${password}
```
Response (200 OK):

```
{
"token":
"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtYm9mIiwiYXVkIjoiQ29ycmVvIEFyZ2Vu
dGlubyIsIm1lbWJlciBvZiI6Ik1pZGRsZXdhcmUiLCJpc3MiOiJDT1JBU0EiLCJleHAiOjE2NTEwMTg1OD
AsImlhdCI6MTY1MTAwOTU4MCwianRpIjoiMDAxIn0.XTekibPPBVKU-iX1kAKKUZB6NwyGGFsXzVrCB-
Cmy8Q",
"expires": "2022-04-26 21:16:20"
}
```
Response (401 Unauthorized):

```
{
"code": "401",
"message": "Unauthorized"
}
```
Para consumir el resto de los endpoints deberá enviar la solicitud con el encabezado de autorización
'Authorization' (bearer auth):

```
curl -X POST ${BASE_URL}/register
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d '{"firstName":"Juan","lastName":"Gonzalez",...}'
```
```
Todas las solicitudes deben realizarse a través de HTTPS. Las llamadas realizadas a través de HTTP
simple fallarán. Las solicitudes de API sin autenticación también fallarán
Sus claves API tienen muchos privilegios, ¡así que asegúrese de mantenerlas seguras! No comparta sus
claves API secretas en áreas de acceso público como GitHub, código del lado del cliente, etc.
```

## Errores

Usamos códigos de respuesta HTTP convencionales para indicar el éxito o el fracaso de una solicitud API. En
general: los códigos en el rango 2xx indican éxito. Los códigos en el rango 4xx indican un error que falló dada
la información proporcionada (por ejemplo, se omitió un parámetro requerido, falló una carga, etc.). Los
códigos en el rango 5xx indican un error con los servidores de Correo (estos son raros).

Response Example (404 NOT FOUND):

```
{
"code": "404",
"message": "Resource not found",
}
```
### HTTP Status Code Summary

```
200 - OK Todo funcionó como se esperaba.
400 - Bad
Request La solicitud es inaceptable (probablemente a la falta de un parámetro obligatorio).
401 -
Unauthorized No se ha proporcionado un token de acceso válido.
402 - Request
Failed Los parámetros enviados son válidos pero la solicitud falló.
403 - Forbidden El token de acceso no tiene permisos para realizar la solicitud.
404 - Not Found El recurso solicitado no existe.
409 - Conflict La solicitud entra en conflicto con otra solicitud (quizás debido al uso de la mismaclave idempotente).
429 - Too Many
Requests
```
```
Demasiadas solicitudes llegan a la API demasiado rápido. Recomendamos un
retroceso exponencial de sus solicitudes.
50x - Server
Errors Servicio no disponible
```
## Endpoints

```
/register [POST], registra un usuario nuevo en MiCorreo.
/users/validate [POST], devuelve el id de un usuario de MiCorreo.
/agencies [GET], devuelve las sucursales de una provincia determinada.
/rates [POST], devuelve la cotización de un envío.
/shipping/import [POST], importa un envío a MiCorreo.
/shipping/tracking [GET], obtiene el seguimiento de un envío a MiCorreo.
```
## /register [POST]


Registra un nuevo usuario en la plataforma MiCorreo. Hay dos tipos de alta de usuario posibles, consumidor
final o con CUIT, para monotributistas o responsables inscriptos.

### Body Attributes

```
Campo Descripción Requerido
firstName Nombre ✔
lastName ** Apellido
email * Dirección de correo electrónico, no debe existir en la plataformaMiCorreo. ✔
```
```
documentType Tipo de documento, "DNI" para consumidores finales, "CUIT" paramonotributistas o responsables inscriptos. ✔
documentId Número de DNI o CUIT, según el campo documentType. ✔
phone Número de teléfono.
cellPhone Número de celular.
address.streetName ** Nombre de la calle de la dirección.
address.streetNumber ** Altura o número de la dirección
address.floor Piso de la dirección.
address.apartment Departamento (piso dpto.) de la dirección.
address.city ** Nombre de la ciudad de la dirección.
address.provinceCode ** Codigo de la provincia de la dirección.
address.postalCode ** Código Postal de la dirección.
```
* Este servcio no dispone de ningún mecanismo de validación del correo electrónico (campo email).

** obligatorio para DNI.

Request - Registro consumidor final:

```
{
"firstName": "Juan",
"lastName": "Gonzalez",
"email": "email@mail.com",
"password": "123456",
"documentType": "DNI",
"documentId": "32471960",
"phone": "1165446544",
"cellPhone": "1165446544",
"address": {
"streetName": "Vicente Lopez",
"streetNumber": "448",
```

```
"floor": "1",
"apartment": "D",
"locality": "Monte Grande",
"city": "Esteban Echeverria",
"provinceCode": "B",
"postalCode": "B1842ZAB"
}
}
```
Request - Registro empresas, monotributista, etc.:

```
{
"firstName": "Juan",
"lastName": "Gonzalez",
"email": "email@mail.com",
"password": "123456",
"documentType": "CUIT",
"documentId": "30324719607",
"phone": "1165446544",
"cellPhone": "1165446544",
"address": {
"streetName": "Vicente Lopez",
"streetNumber": "448",
"floor": "1",
"apartment": "D",
"locality": "Monte Grande",
"city": "Esteban Echeverria",
"provinceCode": "B",
"postalCode": "B1842ZAB"
}
}
```
```
curl -X POST ${BASE_URL}/register
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d '{"firstName":"Juan","lastName":"Gonzalez",...}'
```
Response (200 OK):

```
{
"customerId": "0090000024",
"createdAt":"2022-04-28 12:08:16.847"
}
```
### Response Attributes


```
CampoCampo DescrDescripciónipción
customerId Identificador de usuario de MiCorreo.
createdAt Fecha de creación del registro.
```
Response (402 Error):

```
{
"code": "402",
"message": "Error..."
}
```
Response (402 Error):

```
{
"code": "402",
"message": "Email existente...."
}
```
## /users/validate [POST]

Devuelve el ID de un usuario de MiCorreo

### Body Attributes

```
Campo Descripción Requerido
email Email registrado. ✔
password Contraseña valida. ✔
```
Request:

```
curl -X POST ${BASE_URL}/users/validate
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d '{"email":"email2@mail.com","password":"secret"}'
```
Response (200 OK):

```
{
"customerId": "0090000025",
"createdAt": "2021-03-10"
}
```

Response (404 NOT FOUND):

```
{
"code": "404",
"message": "Usuario no valido o inexistente",
}
```
## /agencies [GET]

Devuelve las sucursales de una provincia determinada.

### Query Attributes

```
Campo Descripción Requerido
customerId Identificador de usuario de MiCorreo. ✔
provinceCode Código de provincia. ✔
services "package_reception", "pickup_availability"
```
Request:

```
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..." \
${BASE_URL}/agencies \
--data-urlencode "customerId=0090000025" \
--data-urlencode "provinceCode=B"
```
Response (200 OK):

```
[
{
"code": "B0107",
"name": "Monte Grande",
"manager": "Denardo, Matías Gabriel",
"email": "sopoficina@correoargentino.com.ar",
"phone": "(03401) 448396",
"services": {
"packageReception": true,
"pickupAvailability": true
},
"location": {
"address" : {
"streetName": "Vicente Lopez",
"streetNumber": "448",
"floor": null,
"apartment": null,
"locality": "Monte Grande",
```

```
"city": "Esteban Echeverria",
"province": "Buenos Aires",
"provinceCode": "B",
"postalCode": "B1842ZAB"
},
"latitude": "-34.81939997",
"longitude": "-58.46747615"
},
"hours": {
"sunday": null,
"monday": { "start": "0930", "end": "1800" },
"tuesday": { "start": "1000", "end": "1800" },
"wednesday": { "start": "1000", "end": "1800" },
"thursday": { "start": "1000", "end": "1800" },
"friday": { "start": "1000", "end": "1800" },
"saturday": null,
"holidays": null
},
"status": "ACTIVE"
}
]
```
Response (402 Error):

```
{
"code": "402",
"message": "Customer ID no valido"
}
```
## /rates [POST]

Devuelve las cotizaciciones de un envío a destino o a una sucursal.

### Body Attributes

```
Campo Descripción Requerido
customerId Identificador de usuario de MiCorreo. ✔
postalCodeOrigin CP de origen del envío a cotizar. ✔
postalCodeDestination CP de destino del envío a cotizar. ✔
deliveredType "D" para entrega a domicilio, o "S" para entrega en sucursal.
dimensions.weight Peso en gramos del envío (mínimo 1g y máximo 25000g). ✔
dimensions.height Alto en centímetros del envío (máximo 150cm). ✔
dimensions.width Ancho en centímetros del envío (máximo 150cm). ✔
dimensions.length Largo en centímetros del envío (máximo 150cm). ✔
```

All fields of the dimensions object are integer values (max precision )

Request - **Envío a Domicilio** :

```
{
"customerId": "0000550137",
"postalCodeOrigin": "1757",
"postalCodeDestination": "1704",
"deliveredType": "D",
"dimensions": {
"weight": 2500 ,
"height": 10 ,
"width": 20 ,
"length": 30
}
}
```
```
curl -X POST ${BASE_URL}/rates
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d
'{"customerId":"0090000025","postalCodeOrigin":"1757","postalCodeDestination":
"1704",...}'
```
Response (200 OK):

```
{
"customerId": "0000550997",
"validTo": "2022-06-07T10:31:27.881-03:00",
"rates": [
{
"deliveredType": "D",
"productType": "CP",
"productName": "Correo Argentino Clasico",
"price": 498.06,
"deliveryTimeMin": "2",
"deliveryTimeMax": "5"
}
]
}
```
Request - **Envío a Sucursal** :

```
{
"customerId": "0000550997",
"postalCodeOrigin": "1757",
```

```
"postalCodeDestination": "1704",
"deliveredType": "S",
"dimensions": {
"weight": 2500 ,
"height": 10 ,
"width": 20 ,
"length": 30
}
}
```
```
curl -X POST ${BASE_URL}/rates
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d
'{"customerId":"0090000025","postalCodeOrigin":"1757","postalCodeDestination":
"1704",...}'
```
Response (200 OK):

```
{
"customerId": "0000550997",
"validTo": "2022-06-07T10:31:27.881-03:00",
"rates": [
{
"deliveredType": "S",
"productType": "CP",
"productName": "Correo Argentino Clasico",
"price": 398.06,
"deliveryTimeMin": "2",
"deliveryTimeMax": "5"
}
]
}
```
Request - **Las dos cotizaciones en un mismo request** :

```
{
"customerId": "0000550997",
"postalCodeOrigin": "1757",
"postalCodeDestination": "1704",
"dimensions": {
"weight": 2500 ,
"height": 10 ,
"width": 20 ,
"length": 30
}
}
```

```
curl -X POST ${BASE_URL}/rates
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d
'{"customerId":"0090000025","postalCodeOrigin":"1757","postalCodeDestination":
"1704",...}'
```
Response (200 OK):

```
{
"customerId": "0000550997",
"validTo": "2022-06-07T10:31:27.881-03:00",
"rates": [
{
"deliveredType": "D",
"productType": "CP",
"productName": "Correo Argentino Clasico",
"price": 498.06,
"deliveryTimeMin": "2",
"deliveryTimeMax": "5"
},
{
"deliveredType": "S",
"productType": "CP",
"productName": "Correo Argentino Clasico",
"price": 398.06,
"deliveryTimeMin": "2",
"deliveryTimeMax": "5"
}
]
}
```
Response (402 ERROR):

```
{
"code": "402",
"message": "Cliente FAP no identificado {customerId}",
}
```
## /shipping/import [POST]

Importa un envío a MiCorreo.

### Body Attributes


**CampoCampo DescrDescripciónipción RRequerequeridoido**
customerId Identificador de usuario de MiCorreo. ✔
extOrderId Identificador externo de la Orden. ✔
orderNumber Identificador externo para ver en MiCorreo.
sender Información del remitente.
sender.name Nombre del remitente.
sender.phone Número de teléfono del remitente.
sender.cellPhone Número de celular del remitente.
sender.email Dirección de correo electrónico del remitente.
sender.originAddress Dirección del remitente.
sender.originAddress.streetName Nombre de la calle de la dirección.
sender.originAddress.streetNumber Altura o numero de la dirección.
sender.originAddress.floor Piso de la dirección.
sender.originAddress.apartment Departamento de la dirección.
sender.originAddress.city Ciudad de la dirección.
sender.originAddress.provinceCode Código de la provincia de la dirección.
sender.originAddress.postalCode Código Postal de la dirección.
recipient Información del Destinatario. ✔
recipient.name Nombre del destinatario del envío. ✔
recipient.phone Número de teléfono del destinatario.
recipient.cellPhone Número de celular del destinatario.
recipient.email Dirección de correo electrónico del destinatario. ✔
shipping Información del envío. ✔

shipping.deliveryType Tipo de envío: "D" (no "S") envío a domicilio, "S"envío a sucursal. ✔

shipping.productType Tipo de entrega por defecto "CP" ✔

shipping.agency Para envíos a sucursal, definir el código de la sucursaly solo en ese caso es obligatorio.

shipping.address.streetName * Nombre de la calle de la dirección de envío.
shipping.address.streetNumber * Altura o numero de la dirección del envío.
shipping.address.floor Piso de la dirección de envío. (trunc to 3 characters)


```
Campo Descripción Requerido
shipping.address.apartment Departamento de la dirección de envío. (trunc to 3characters)
shipping.address.city * Ciudad de la dirección de envío.
shipping.address.provinceCode * Código de la provincia de la dirección de envío.
shipping.address.postalCode * Código Postal de la dirección de envío.
shipping.weight Peso del envío en gramos. ✔
shipping.declaredValue Valor declarado del envío. ✔
shipping.height Alto en centímetros del envío. ✔
shipping.length Largo del envío en centímetros. ✔
shipping.width Ancho del envío en centímetros ✔
```
* Solo obligatorios para envio a Domicilio (shipping.deliveryType != "S" (no S))

The fields weight, height, length and width of the shipping object are integer values (max precision )

Request - **Envío a Domicilio** :

```
{
"customerId": "0005000033",
"extOrderId": "583358193",
"orderNumber": "102",
"sender": {
"name": null,
"phone": null,
"cellPhone": null,
"email": null,
"originAddress": {
"streetName": null,
"streetNumber": null,
"floor": null,
"apartment": null,
"city": null,
"provinceCode": null,
"postalCode": null
}
},
"recipient": {
"name": "Aa cc",
"phone": "",
"cellPhone": "",
"email": "username@mail.com",
},
"shipping": {
"deliveryType": "D",
```

```
"agency": null,
"address": {
"streetName": "Bb",
"streetNumber": "1234",
"floor": "",
"apartment": "",
"city": "Buenos Aires",
"provinceCode": "B",
"postalCode": "1425"
},
"productType":"CP",
"weight": 1000 ,
"declaredValue": 500.00,
"height": 20 ,
"length": 40 ,
"width": 20 ,
}
}
```
```
curl -X POST ${BASE_URL}/shipping/import
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d '{"customerId":"0005000033","extOrderId":"583358193","orderNumber":
"102",...}'
```
Request - **Envío a sucursal** :

```
{
"customerId": "0005000033",
"extOrderId": "583358194",
"orderNumber": "103",
"sender": {
"name": null,
"phone": null,
"cellPhone": null,
"email": null,
"originAddress": {
"streetName": null,
"streetNumber": null,
"floor": null,
"apartment": null,
"city": null,
"provinceCode": null,
"postalCode": null
}
},
"recipient": {
"name": "Aa cc",
"phone": "",
```

```
"cellPhone": "",
"email": "username@mail.com",
},
"shipping": {
"deliveryType": "S",
"agency": "E0000",
"address": {
"streetName": "Bb",
"streetNumber": "1234",
"floor": "",
"apartment": "",
"city": "Buenos Aires",
"provinceCode": "B",
"postalCode": "1425"
},
"productType":"CP",
"weight": 1000 ,
"declaredValue": 500.00,
"height": 20 ,
"length": 40 ,
"width": 20 ,
}
}
```
```
curl -X POST ${BASE_URL}/shipping/import
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d '{"customerId":"0005000033","extOrderId":"583358194","orderNumber":
"103",...}'
```
Response (200 OK):

```
{
"createdAt": "2022-06-07T16:15:04.996-03:00"
}
```
Response (402 Error):

```
{
"code": "402",
"message": "Error ..."
}
```
**Error messages** (from WCP):

```
La orden ya fue importada con anterioridad.
```

```
Peso no valido
Tipo de entrega invalido
Verifique la sucursal de destino
Tipo de encomienda [TENC] no valida
El peso debe ser mayor a 0
El peso excede el maximo permitido para el producto
no se encontro datos de remitente - id :...
El codigo Postal del emisor debe tener valor.
La provincia del emisor debe tener valor.
La provincia es invalida.
El alto debe estar entre 0 y 255.
El ancho debe estar entre 0 y 255.
El largo debe estar entre 0 y 255.
```
# Notes:

## Province Codes

```
Code Province name
A Salta
B Provincia de Buenos Aires
C Ciudad Autonoma Buenos Aires (o Capital Federal)
D San Luis
E Entre Rios
F La Rioja
G Santiago del Estero
H Chaco
J San Juan
K Catamarca
L La Pampa
M Mendoza
N Misiones
P Formosa
Q Neuquen
R Rio Negro
S Santa Fe
```

```
Code Province name
T Tucuman
U Chubut
V Tierra del Fuego
W Corrientes
X Cordoba
Y Jujuy
Z Santa Cruz
```
## /shipping/tracking [GET]

Obtiene el seguimiento de una Orden Importada a MiCorreo.

### Body Attributes

```
Campo Descripción Requerido
shippingId Identificador el envio del cliente ✔
```
Request - **Seguimiento de una Orden Importada** :

```
{
"shippingId": "000500076393019A3G0C701"
}
```
```
curl -X GET ${BASE_URL}/shipping/trakcing
-H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
-H 'Content-Type: application/json'
-d '{"shippingId":"1627673L5832C9C501"}'
```
Response (200 OK):

```
[
{
"id": "000017496",
"productId": "HC",
"trackingNumber": "000500076393019A3G0C701",
"events": [
{
"event": "CADUCA",
"date": "09-12-2024 05:00",
"branch": "CORREO ARGENTINO",
```

```
"status": "",
"sign": ""
},
{
"event": "PREIMPOSICION",
"date": "28-08-2024 10:33",
"branch": "CORREO ARGENTINO",
"status": "",
"sign": ""
}
]
}
]
```
Response (200 OK):

```
{
"id": null,
"productId": null,
"trackingNumber": "000500076393019A3G0C701K",
"events": []
}
```
Response (200 OK):

```
{
"date": "2025-01-13T14:56:09.832-03:00",
"error": "No existe el cliente o pedido",
"code": "0"
}
```