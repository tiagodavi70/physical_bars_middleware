from flask import Flask, request, jsonify
import serial
import time
import json

port = 'COM3'  # Porta serial utilizada
baud = 9600  # Velocidade de comunicação serial

app = Flask(__name__)

mode = 'DEBUG'

@app.route('/defineTamanhoBarras', methods=['POST'])
def handle_post():
	json_data = request.get_json()
	data = str(json_data['data'])

	striped_data = data.replace(" ", "")
	if mode != 'DEBUG':
		sendToArduino(striped_data)
	
	return jsonify({'message': 'JSON recebido com sucesso!'})


@app.route('/mainPayload', methods=['POST'])
def payload():
	
	json_data = request.get_json()
	print(json_data)
	
	return jsonify({'message': 'JSON recebido com sucesso!'})


if __name__ == '__main__':
	app.run(host="localhost", port=9600, debug=True)


def sendToArduino(data):
	# Configuração da porta serial
	ser = serial.Serial(port, baud, timeout=1)

	# Aguarda a inicialização da porta serial
	time.sleep(1)

	# Envia a string pela porta serial
	ser.write(data.encode())
	# Fecha a porta serial

	while True:
		# Lê uma linha da porta serial
		line = ser.readline().decode().strip()
		
		# Imprime a linha lida
		print(line)
		
		# Verifica se a tecla 'F' foi digitada
		if 'F' in line:
			ser.close()
			break


# String a ser enviada (valores double separados por vírgula)


import serial

# Configuração da porta serial
ser = serial.Serial('COM1', 9600)

# Lê as respostas da porta serial até que a tecla 'F' seja digitada


# Fecha a porta serial
ser.close()
