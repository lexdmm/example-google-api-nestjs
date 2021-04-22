import { Injectable } from '@nestjs/common';
import { get } from 'config';
import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';

@Injectable()
export class AppGsuiteService {
  // Se modificar esses escopos, exclua token.json.
  private SCOPES = get('google.scopes');

  /**
   * O arquivo token.json armazena os tokens de acesso e atualização do usuário. Ele é criado 
   * automaticamente quando o fluxo de autorização é concluído para o primeiro tempo
   * ---------------------------------------------------------------------------------------
   * The token.json file stores the user's access and update tokens. It is created
   * automatically when the permission flow is completed for the first time
   */
  private TOKEN_PATH: number = get('google.token_path');
  private CREDENTIALS_FILE_PATH: string = get('google.credentials_path');
  private email: string;
  private userId: number;

  /**
   * Cria um cliente OAuth2 com as credenciais fornecidas e execute a função de retorno de chamada fornecida.
   *
   * @param {Object} credentials As credenciais do cliente de autorização.
   * @param {function} callback O retorno de chamada com o cliente autorizado.
   */
  private authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0],
    );

    // Verifique se já armazenamos um token.
    fs.readFile(this.TOKEN_PATH, (err: NodeJS.ErrnoException, token: string) => {
      if (err) {
        return this.getNewToken(oauth2Client, callback);
      }
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    });
  }

  /**
   * Obtenha e armazene o novo token após solicitar a autorização do usuário e, em
   * seguida, execute o retorno de chamada fornecido com o cliente OAuth2 autorizado.
   *
   * @param {google.auth.OAuth2} oauth2Client O cliente OAuth2 para o qual obter o token.
   * @param {getEventsCallback} callback O retorno de chamada para chamar com o cliente autorizado.
   */
  private getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oauth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oauth2Client.credentials = token;
        this.storeToken(token);
        callback(oauth2Client);
      });
    });
  }

  /**
   * O token de armazenamento no disco pode ser usado em execuções posteriores do programa.
   *
   * @param {Object} token The token to store to disk.
   */
  private storeToken(token) {
    fs.writeFile(this.TOKEN_PATH, JSON.stringify(token), (err) => {
      if (err)
        return console.warn(`Token not stored to ${this.TOKEN_PATH}`, err);
    });
  }

  /**
   * Lista os primeiros 10 usuários no domínio.
   *
   * @param {google.auth.OAuth2} auth Um cliente OAuth2 autorizado.
   */
   getUsers(auth: any) {
    const service = google.admin({ version: 'directory_v1', auth });
    service.users.get(
      {
        userKey: this.email,
      },
      (err: { message: any }, res: { data: any }) => {
        if (err)
          return console.error('The API returned an error:', err.message);

        const user = res.data;
        console.log(`-----------------------------------------------------`);
        console.log(`${user.primaryEmail} (${user.name.fullName})`);
        console.log(`${JSON.stringify(user)}`);
        this.userId = user.id;
      },
    );
  }

  updateUser(auth: any) {
    const service = google.admin({ version: 'directory_v1', auth });
    service.users.update(
      {
        id: this.userId,
        userKey: this.email,
        resource: {
          suspended: false,
        },
      },
      (err: { message: any }, res: { data: any }) => {
        if (err)
          return console.error('The API returned an error:', err.message);

        const user = res.data;

        console.log('Users supended:');
        console.log(`${user.primaryEmail} (${user.name.fullName})`);
        console.log(`suspended: ${user.suspended}`);
      },
    );
  }
}
