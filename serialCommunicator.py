from flask import Flask, request, jsonify
import serial
import time

# flask config:
app = Flask(__name__)
mode = 'DEBUG' 	

## server endpoint
@app.route('/mainPayload', methods=['POST'])
def payload():
	data = request.get_json()
	commands = converterDados(data)

	# serial config:
	port = 'COM4'  # Porta serial utilizada
	baud = 9600  # Velocidade de comunicação serial

	if(mode == 'DEBUG'):
		return jsonify({'message': 'JSON recebido em modo DEBUG!'})
 
	ser = serial.Serial(port, baud, timeout=1)
	time.sleep(1)

	for c in commands:
		print(c)
		ser.write(c.encode())
		time.sleep(5)
  
	ser.close()	
	return jsonify({'message': 'JSON recebido com sucesso!'})
  
def converterDados(data):
	commands = []

	list_string = []

	#display categorias
	for value in data["x"]:
		if len(value) > 7:
			str1 = value[:7]
			str1 += "." * (7 - len(str1))
		else:
			str1 = value + "." * (7 - len(value))
      
		list_string.append(str1)
    
	list_string2 = [] 
	while len(list_string2) < 6:    
		for value in data["catColors"]:
				if len(value) > 7:
					str2 = value[:7]
					str2 += "." * (7 - len(str1))
				else:
					str2 = value + "." * (7 - len(value))
			
				list_string2.append(str2)
		    
	commands.append("5_" + ','.join(str(value) for value in data["colorIndex"]))
	commands.append("2_" + list_string[0] + '|' + list_string[1] + "," + list_string2[0] + '|' + list_string2[1])
	commands.append("3_" + list_string[2] + '|' + list_string[3] + "," + list_string2[2] + '|' + list_string2[3])
	commands.append("4_" + list_string[4] + '|' + list_string[5] + "," + list_string2[4] + '|' + list_string2[5]) 
 
	print("2_" + list_string[0] + '|' + list_string[1] + "," + list_string2[0] + '|' + list_string2[1])
	print("3_" + list_string[2] + '|' + list_string[3] + "," + list_string2[2] + '|' + list_string2[3])
	print("4_" + list_string[4] + '|' + list_string[5] + "," + list_string2[4] + '|' + list_string2[5]) 
  
	commands.append("1_" + ','.join(str(value) for value in data["size"]))
	commands.append("6")
	return commands

if __name__ == '__main__':
	app.run(host="localhost", port=9600, debug=True)
