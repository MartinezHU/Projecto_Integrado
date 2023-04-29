import paypalrestsdk
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from paypalrestsdk import Payment
from rest_framework import viewsets, status
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.generics import GenericAPIView, get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models.functions import ExtractMonth

from main.serializers import *


# Create your views here.
class UsuarioView(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def update(self, request, *args, **kwargs):
        # Obtener el usuario que se va a actualizar
        usuario = self.get_object()

        # Obtener los datos actualizados del usuario
        serializer = self.get_serializer(usuario, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Verificar si se cambió la contraseña
        if 'password' in request.data:
            # Cambiar la contraseña del usuario
            usuario.set_password(request.data['password'])
            usuario.save()

            # Regenerar el token de autenticación del usuario
            usuario.regenerar_token()

        return Response(serializer.data)


class EstacionView(viewsets.ModelViewSet):
    queryset = Estacion.objects.all()
    serializer_class = EstacionSerializer


class PuestoView(viewsets.ModelViewSet):
    queryset = Puesto.objects.all()
    serializer_class = PuestoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['idEstacion']


class PatineteView(viewsets.ModelViewSet):
    queryset = Patinete.objects.all()
    serializer_class = PatineteSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['idUsuario']


class ConexionView(viewsets.ModelViewSet):
    serializer_class = ConexionSerializer
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        queryset = Conexion.objects.all()
        usuario_id = self.request.query_params.get('idUsuario')
        mes = self.request.query_params.get('mes')

        if usuario_id:
            queryset = queryset.filter(idUsuario=usuario_id)

        if mes:
            queryset = queryset.annotate(mes=ExtractMonth('horaConexion')).filter(mes=mes)

        return queryset


class PagoView(viewsets.ModelViewSet):
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer


class ComunidadAutonomaView(viewsets.ModelViewSet):
    queryset = ComunidadAutonoma.objects.all()
    serializer_class = ComunidadAutonomaSerializer


class ProvinciaView(viewsets.ModelViewSet):
    queryset = Provincia.objects.all()
    serializer_class = ProvinciaSerializer


class LoginView(ObtainAuthToken):

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token = Token.objects.get(user=user)
        print(token.key + ", " + user.username)
        return Response({
            'token': token.key,
            'id': user.pk,
            'username': user.username
        })


class Registro(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegistroSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = RefreshToken.for_user(user)
        data = serializer.data
        data["tokens"] = {"refresh": str(token), "access": str(token.access_token)}
        return Response(data, status=status.HTTP_201_CREATED)


class CreatePaymentView(APIView):
    def post(self, request):
        conexion = request.data['conexion']
        conexion_obj = get_object_or_404(Conexion, id=conexion['id'])
        monto = ''
        if not conexion_obj.finalizada:
            zona_horaria = timezone.get_fixed_timezone(120)  # UTC+2
            # fecha_hora_manual = timezone.datetime(2023, 4, 28, 17, 30, tzinfo=zona_horaria)
            conexion_obj.horaDesconexion = timezone.now()
            # conexion_obj.horaDesconexion = fecha_hora_manual
            conexion_obj.calcular_monto()
            monto = str(conexion_obj.monto)
        # Crear objeto Payment con la información del pago
        payment = Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "transactions": [{
                "amount": {
                    "total": str(conexion_obj.monto),
                    "currency": "USD"
                },
                "description": "Compra de prueba"
            }],
            "redirect_urls": {
                "return_url": "http://localhost:8000/execute-payment/",
                "cancel_url": "http://localhost:4200"
            }
        })

        # Crear el pago en PayPal
        if payment.create():
            approval_url = next(link.href for link in payment.links if link.rel == "approval_url")
            return Response({"approval_url": approval_url})
        else:
            return Response({"error": payment.error})


class CapturePaymentView(APIView):
    def post(self, request):
        payment_id = request.data.get("payment_id")
        payer_id = request.data.get("payer_id")

        # Obtener el objeto Payment correspondiente al pago
        payment = Payment.find(payment_id)

        # Capturar el pago en PayPal
        if payment.execute({"payer_id": payer_id}):
            return Response({"success": True})
        else:
            return Response({"error": payment.error})



# class PayPalAPIView(APIView):
#     def post(self, request):
#         payment_data = request.data['paymentData']
#         conexion_data = request.data['conexion']
#         conexion = get_object_or_404(Conexion, id=conexion_data['id'])
#         print(conexion)
#         # Your PayPal integration code here
#         payment = Payment({
#             "intent": "sale",
#             "payer": {
#                 "payment_method": "paypal"
#             },
#             "redirect_urls": {
#                 "return_url": "http://localhost:8000/success",
#                 "cancel_url": "http://localhost:8000/cancel"
#             },
#             "transactions": [{
#                 "item_list": {
#                     "items": [{
#                         "name": "item",
#                         "sku": "item",
#                         "price": "1.00",
#                         "currency": "USD",
#                         "quantity": 1
#                     }]
#                 },
#                 "amount": {
#                     "total": "1.00",
#                     "currency": "USD"
#                 },
#                 "description": "This is the payment transaction description."
#             }]
#         })
#         if payment.create():
#             return Response({"paymentID": payment.id})
#         else:
#             return Response({"error": payment.error})

