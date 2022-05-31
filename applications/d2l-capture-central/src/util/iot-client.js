import { iot, mqtt } from 'aws-iot-device-sdk-v2';
import { v4 as uuidv4 } from 'uuid';

export default class IotClient {
	constructor({
		tenantId,
		region,
		host,
		accessKeyId,
		secretAccessKey,
		sessionToken
	},
	onMessage) {
		const config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_with_websockets();

		config_builder.with_clean_session(false);
		config_builder.with_client_id(uuidv4()); // client ID must be unique as messages are only guaranteed to be delivered once for each client ID
		config_builder.with_endpoint(host);
		config_builder.with_credentials(region, accessKeyId, secretAccessKey, sessionToken);
		const config = config_builder.build();
		const client = new mqtt.MqttClient();

		const clientConnection = client.new_connection(config);

		clientConnection
			.on('connect', () => {
				clientConnection.subscribe(`${tenantId}/#`, 1); // Match tenant1 followed by any number of additional topics, deliver message at least once
			});

		clientConnection
			.on('message', (topic, payload) => {
				onMessage(topic, payload);
			});

		this.device = clientConnection;
	}
}
