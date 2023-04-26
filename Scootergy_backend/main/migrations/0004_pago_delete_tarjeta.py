# Generated by Django 4.1.8 on 2023-04-25 11:28

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0003_conexion_finalizada'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pago',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('monto', models.DecimalField(decimal_places=2, max_digits=10)),
                ('moneda', models.CharField(max_length=3)),
                ('fecha', models.DateTimeField(auto_now_add=True)),
                ('id_transaccion_paypal', models.CharField(max_length=100)),
                ('conexion', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, to='main.conexion')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.RESTRICT, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.DeleteModel(
            name='Tarjeta',
        ),
    ]