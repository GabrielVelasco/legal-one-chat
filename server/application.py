from flask import Flask, json, jsonify, request
from flask_cors import CORS

# create the flask app instance (instance name must be 'application' for deploying to beanstalk)
application = Flask(__name__) 

CORS(application)

@application.route('/proc/<proc_id>/chat', methods=['POST'])
def post_task_chat_to_db(proc_id):

    print(f"Request: {request.json}")

    # taks_chat_db.json example:
    # {
    #   "28132": {
    #     "id": 28132,
    #     "messages": [
    #       {
    #         "msg": "msg para chat ..132",
    #         "username": "GABRIEL DE ARAUJO VELASCO"
    #       },
    #       {
    #         "msg": "sim, msg para este chat id ..132",
    #         "username": "FERNANDO PEREIRA"
    #       }
    #     ]
    #   },
    # 
    #   ...
    # } 

    # req body example (json):
    # {"msg": "msg para chat ..132", "username": "GABRIEL DE ARAUJO VELASCO" }

    # append new message to the task chat

    # get data from 'tasks_chat_db.json' file
    try:
        with open('tasks_chat_db.json', 'r') as f:
            proc_chat_db = json.load(f)
    except FileNotFoundError:
        proc_chat_db = {}

    # Check if taskid exists in the task_db
    if proc_id not in proc_chat_db:
        proc_chat_db[proc_id] = {'id': proc_id, 'messages': []}
    
    # append new message to the task chat
    proc_chat_db[proc_id]['messages'].append(request.json)

    # save data to 'tasks_chat_db.json' file
    with open('tasks_chat_db.json', 'w') as f:
        json.dump(proc_chat_db, f)

    return jsonify(proc_chat_db[proc_id]), 201

@application.route('/proc/<proc_id>/chat', methods=['GET'])
def get_task_chat_from_db(proc_id):  
    
    # get data from 'tasks_chat_db.json' file
    try:
        with open('tasks_chat_db.json', 'r') as f:
            proc_chat_db = json.load(f)
    except FileNotFoundError:
        return jsonify({'message': 'DB not found!'}), 404
    except json.JSONDecodeError:
        return jsonify({'message': 'Error decoding the DB file!'}), 404

    # Check if taskid exists in the task_db
    if proc_id not in proc_chat_db:
        return jsonify({'message': 'msg not found!'}), 404

    return jsonify(proc_chat_db[proc_id]), 200

@application.route('/tmp', methods=['GET'])
def single_text():
    res = {
	'id': '123456',
        'messages': [{'username': 'GABRIEL DE ARAUJO VELASCO', 'msg': 'bla bla bla bla'}, {'username': 'fulano', 'msg': 'foo foo foo'}],
        'another_key': 'another_value'
    }

    return jsonify(res)

if __name__ == '__main__':
    application.run(debug=True)
