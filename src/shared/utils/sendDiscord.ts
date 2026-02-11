import axios from "axios";
import * as moment from 'moment-timezone';
import { env } from "../config";

class SendDiscord {

  urlWebhookDiscord: Map<string, string>;

  constructor(){
    this.urlWebhookDiscord = new Map()
    .set('KAFKA_ALERT', env.URL_WEBHOOK_KAFKA_ALERT)
  }

  maxLength = (str:string,length = 1020 ) => {
  
    if (str.length > length) {
      const shortenedStr = str.slice(0, length) + " ...";
      return shortenedStr
    } 
  
    return str
  }

  getDateTimeBrasilia = async (date = "") => {

    // Define a data e hora em UTC
    const utcDateTime = date ? new Date(date) : new Date()

    // Define o fuso horário de Brasília
    const brasiliaTimeZone = 'America/Sao_Paulo';

    // Cria um objeto Moment.js com a data e hora em UTC
    const momentUtc = moment.utc(utcDateTime);

    // Converte para o horário de Brasília
    const momentBrasilia = momentUtc.tz(brasiliaTimeZone);

    return momentBrasilia
  }

  field = async (message: string) => {
    const field = [
      {
        name: "**MESSAGE**",
        value: this.maxLength(message)
      }
    ];

    return field;
  }

  /**
   * Valida se o alert_id existe no mapa de webhooks
   */
  validateAlertId = (alertId: string): boolean => {
    return this.urlWebhookDiscord.has(alertId);
  }

  /**
   * Retorna lista de alertas disponíveis
   */
  getAvailableAlerts = (): string[] => {
    return Array.from(this.urlWebhookDiscord.keys());
  }

  /**
   * Envia um alerta genérico para o Discord
   */
  sendAlert = async (alertId: string, title: string, message: string) => {
    const field = await this.field(message);

    const fields = {
      EmbedTitle: this.getEmbedTitle(alertId),
      title: title,
      userName: alertId,
      field: field
    };

    await this.sendDiscord(fields);
  }

  /**
   * Retorna o título do embed baseado no alert_id
   */
  private getEmbedTitle = (alertId: string): string => {
    const embedTitles: { [key: string]: string } = {
      'KAFKA_ALERT': '☠️ KAFKA ALERT ☠️'
    };

    return embedTitles[alertId] || `🔔 ${alertId.toUpperCase()} 🔔`;
  }

  /**
   * @deprecated Use sendAlert() para novos alertas
   */
  kafkaError = async (e:any) => {
   
    const fields = {
      EmbedTitle:'☠️ KAFKA ☠️',
      title:e?.title || 'Error',
      userName:'kafka_boring',
      field:{}
    }
    
    fields.field = await this.fieldLegacy(e)

    await this.sendDiscord(fields)
  }

  /**
   * @deprecated Mantido para compatibilidade com código legado
   */
  private fieldLegacy = async (e:any) => {

    const field = []
  
    if((e?.error_message || false)) field.push({                     
      name: "**ERROR MESSAGE**",
      value: this.maxLength(e.error_message) 
    })

    if((e?.discordInfo || false)) field.push({                     
      name: "**DISCORD INFO**",
      value: this.maxLength(e.discordInfo) 
    })

    if(e?.details || e?.data?.details || false) field.push({
      name: "**DETAILS**",
      value:this.maxLength(e?.details || e.data.details)
    })

    if(e?.message || false) field.push({
      name: "**MESSAGE**",
      value:this.maxLength(e.message)
    })

    if(e?.msg || false) field.push({
      name: "**MSG**",
      value:this.maxLength(e.msg)
    })

    if(e?.response?.data?.message || false) field.push({
      name: "**ALEMAO API**",
      value: this.maxLength(e.response.data.message) 
    })

    if((e?.error_response || false) && typeof e.error_response === "string") field.push({
      name: "**ERROR REQUEST**",
      value: this.maxLength(e.error_response)
    })

    if((e?.error_request || false) && typeof e.error_request === "string") field.push({
      name: "**ERROR REQUEST**",
      value: this.maxLength(e.error_request)
    })

    if(e?.stack || false) field.push({
        name: "**STACK**",
        value: this.maxLength(e.stack)
    })
    if(e?.file || false) field.push({
      name: "**FILE**",
      value: e.file,
      inline: true
    })
    if(e?.line || false) field.push({
      name: "**LINE**",
      value: e.line,
      inline: true
    })

    return field

  }

  
  sendDiscord = async (fields:any) =>{

    const dateNow = await this.getDateTimeBrasilia()
    
    const body =
    {
      content : `━━━━━━━━━━━━━━━━━━━━━━━━━ ** ${fields.EmbedTitle} ** ━━━━━━━━━━━━━━━━━━━━━━━━━\n`+
                "<@986261387271614475> <@198580668102475779>",
      embeds: [
        {
          timestamp:  new Date().toISOString(),
          author: {
            name: fields.userName,
            "icon_url" : "https://cdn-icons-png.flaticon.com/512/5974/5974693.png"
          },
          color: 697832,
          title: fields.title,
          fields: [
            ...fields.field,
            { name: '\u200B', value: '\u200B'},
            {
              name: "Date",
              value:  dateNow.format('YYYY-MM-DD'),
              inline: true
            },
            { name: '\u200B', value: '\u200B',inline: true},
            {
              name:  "Time",
              value:  dateNow.format('HH:mm'),
              inline: true
            },
          ]
        }
      ]
    }
      
    const webhook =  this.urlWebhookDiscord.get(fields.userName)

    await this.delay(10000);
               
    await axios.post(
    `https://discord.com/api/webhooks/${webhook}`
    ,body)
    .then(res => res)
    .catch( async e =>{
      console.log('Falha ao enviar erro para discord');
      console.log('❌ ERROR',e?.response?.data?.error || '','❌')
      console.log('❌ EMBED',e?.data?.embeds|| '','❌')
      console.log('❌ EMBED',e?.response?.data?.embeds || '','❌')
      
      await this.sendDiscordErroGuarantee(`Não foi possivel enviar error para o Discord cron youtube (**${fields.userName}**)`,webhook)
      await this.delay(10000);
        
      return false
    })
    //await this.delay(1000);
    return true


  }

  delay = (ms:any) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  sendDiscordErroGuarantee = async (message: string,webhook: string | undefined) => {
    const date  = new Date
    const hr  = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    const now  = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}` 

    await axios.post(
      `https://discord.com/api/webhooks/${env.URL_WEBHOOK_ERROR_SEND_DISCORD_I}`
      ,{
        content : `<@986261387271614475> ${message}`
      })
      .then(res => res)
      .catch(e => {
        console.log('❌ Falhas ❌', now, hr)
  
      })
  }

}

export default new SendDiscord();