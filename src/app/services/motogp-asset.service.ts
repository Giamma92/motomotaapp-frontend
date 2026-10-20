import { Injectable } from '@angular/core';

export interface RiderAssetInfo {
  name: string;
  photoUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class MotoGPAssetService {

  // Official MotoGP high-resolution rider portraits from Pulselive CDN
  private readonly riderMapByNumber: Record<number, RiderAssetInfo> = {
    5: {
      name: 'Johann Zarco',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/02/05/500a8953-da3c-4203-b627-efa7382f114b/y0R5f9H5.png'
    },
    7: {
      name: 'Toprak Razgatlıoğlu',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/02/05/cbe574f6-0e66-4a3c-9350-64f1e704557b/5Zq5W4Wt.png'
    },
    10: {
      name: 'Luca Marini',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/76f9798b-206c-4605-985d-2e0cd45cf946/S6m6LRHY.png'
    },
    11: {
      name: 'Diogo Moreira',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/2eed27ba-a9b5-417c-aa95-3e7ca43f315e/i5riGt65.png'
    },
    12: {
      name: 'Maverick Viñales',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/f0878ffb-c829-4efb-bfd6-85721ea40fc4/7QBpFmT4.png'
    },
    20: {
      name: 'Fabio Quartararo',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/02/05/f187a92d-851f-463d-b5be-9e0d3142d251/L72keLEc.png'
    },
    21: {
      name: 'Franco Morbidelli',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/f99ca6d4-81c1-4e48-8127-bfb0ddc13d9a/srwszjyQ.png'
    },
    23: {
      name: 'Enea Bastianini',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/02/05/2536146f-6f90-417f-82e1-cecd53a1e616/7pX3VTcG.png'
    },
    25: {
      name: 'Raúl Fernández',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/d5f1dc9e-c52c-4acb-933c-122738c568bf/G8ukTN8w.png'
    },
    32: {
      name: 'Lorenzo Savadori',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/04/24/2be31d68-dede-49d4-8473-29a6f1a66103/32-MGP-Lorenzo-Savadori-Rider-Official_DSC09678.png'
    },
    33: {
      name: 'Brad Binder',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/bf5b42bc-9d8e-44b1-b613-41190d6c66ed/tRRDYvaD.png'
    },
    35: {
      name: 'Somkiat Chantra',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/10/01/107c6992-7f7c-48cb-9c18-cd53a885e646/qnk7hrDm.png'
    },
    36: {
      name: 'Joan Mir',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/5452e66d-a008-4966-90cb-c6e255434f92/A9TKY6Q5.png'
    },
    37: {
      name: 'Pedro Acosta',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/209160a5-3cad-422a-bd93-37a72620dd96/YaWdUVdE.png'
    },
    42: {
      name: 'Álex Rins',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/adc99605-f11e-47c5-a340-dda4f4f4bc9d/6zfxJvst.png'
    },
    43: {
      name: 'Jack Miller',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/25011c5a-b978-487b-990f-c54ed993dace/M083EGxS.png'
    },
    46: {
      name: 'Valentino Rossi',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/09/05/fe2b3de7-2c2b-497d-93e6-0440a5e73fa6/k9CnkNtS.png'
    },
    49: {
      name: 'Fabio Di Giannantonio',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/612a3116-31bd-4215-8b04-93749411166e/VEmGm1Zi.png'
    },
    54: {
      name: 'Fermín Aldeguer',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/95b16a4d-b81c-4ddd-90b5-72980a4e39eb/6NErto4j.png'
    },
    63: {
      name: 'Francesco Bagnaia',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/02/05/9262aea5-d54f-433b-9d31-cb595b483d44/IfzOWPi2.png'
    },
    72: {
      name: 'Marco Bezzecchi',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/04b86e99-dc3d-423c-883c-826c9a27fcd7/qp7g53Ik.png'
    },
    73: {
      name: 'Álex Márquez',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/02/05/4475f0bb-745d-468c-b034-dba9de524e90/WezEeZAR.png'
    },
    79: {
      name: 'Ai Ogura',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/0e314a63-cc81-4cd5-88f6-583b9541df55/gKJEk1g6.png'
    },
    88: {
      name: 'Miguel Oliveira',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2025/10/21/7799fc6f-13aa-454c-9ed6-8cf4ad7801db/6FqqBN3i.png'
    },
    89: {
      name: 'Jorge Martín',
      photoUrl: 'https://photos.motogp.com/riders/5/b/5b9af34e-da94-4ca2-9c4c-6be0fc8b1bbc/2026/profile/main-560307.png'
    },
    93: {
      name: 'Marc Márquez',
      photoUrl: 'https://resources.motogp.pulselive.com/motogp/photo/2026/07/03/38347509-c1e3-4bfa-b13b-3d9612aa7218/L0F4WbbF.png'
    }
  };

  // Official MotoGP circuit layout maps from Dorna/Pulselive CDN
  private readonly circuitMap: Record<string, string> = {
    // Standard country keys
    'tha': 'https://photos.motogp.com/events-admin/5/e/5eb8c6ce-f16b-4be5-8aea-39ebaa3b18ba/simple/tha.png',
    'arg': 'https://photos.motogp.com/events-admin/a/1/a1d1e435-100f-4f10-8f16-7aa65d13b67d/simple/arg2.svg',
    'usa': 'https://photos.motogp.com/events-admin/c/7/c7c0782e-67f2-4351-af96-6dd5835e8d42/simple/usa.png',
    'spa': 'https://photos.motogp.com/events-admin/4/2/42621ff3-ef5d-4c7c-8abf-eb54c16181bc/simple/spa.png',
    'fra': 'https://photos.motogp.com/events-admin/4/5/45f698f6-883b-4379-bac3-3253ee6e32e0/simple/fra11.png',
    'cat': 'https://photos.motogp.com/events-admin/e/e/eea725c5-432a-483b-bf46-f9769b8e5ddf/simple/cat.png',
    'ita': 'https://photos.motogp.com/events-admin/a/f/af57cc25-cf15-4f68-b775-ddaea8fec828/simple/ita.png',
    'hun': 'https://photos.motogp.com/events-admin/4/6/46218937-1b94-4d2e-97b7-256b5bf181c3/simple/hun.png',
    'cze': 'https://photos.motogp.com/events-admin/8/1/811bb92b-cf2c-44ec-a188-b9681ba9fc12/simple/cze11.png',
    'ned': 'https://photos.motogp.com/events-admin/2/c/2c30ee0c-d85b-48e1-b6d4-303a2ba22ae1/simple/nld.png',
    'ger': 'https://photos.motogp.com/events-admin/5/c/5cab1166-44c1-45ad-bc30-96d910170097/simple/ger.png',
    'gbr': 'https://photos.motogp.com/events-admin/2/f/2f84e93c-dca6-4ca4-9319-c29eba5bbabb/simple/gbr.png',
    'ara': 'https://photos.motogp.com/events-admin/9/9/99cf40f3-6ed4-4cd9-9c1c-22379f6d929b/simple/ara.png',
    'rsm': 'https://photos.motogp.com/events-admin/0/c/0c4b819d-6014-4920-877b-ab0a1f3415a3/simple/rsm.png',
    'aut': 'https://photos.motogp.com/events-admin/5/3/53e027a4-908f-4253-9805-7321bd212fae/simple/aut.png',
    'jpn': 'https://photos.motogp.com/events-admin/9/f/9fbd0109-0b0b-4bbb-a671-d7840036babe/simple/jpn.png',
    'ina': 'https://photos.motogp.com/events-admin/0/d/0db4e87a-920f-4699-a688-63e22b924f1b/simple/ina.png',
    'aus': 'https://photos.motogp.com/events-admin/c/e/ce2c750b-4a15-4285-966b-5db647e6596a/simple/aus.png',
    'mal': 'https://photos.motogp.com/events-admin/0/7/07f44869-813e-46e6-97ba-aa405e134d87/simple/mal.png',
    'qat': 'https://photos.motogp.com/events-admin/b/1/b1cd25b2-1658-4c3b-bd3f-1a7796f7cd27/simple/qat.png',
    'por': 'https://photos.motogp.com/events-admin/0/b/0b5cf829-21cf-48dd-a324-1465fc504c24/simple/por.png',
    'val': 'https://photos.motogp.com/events-admin/7/9/795839a0-8faa-4f4e-a574-8dce32cfc560/simple/val.png',
    'bra': 'https://photos.motogp.com/events-admin/5/0/50941f7f-e112-4404-8dcf-5fb2c47e9617/simple/bra.png'
  };

  /**
   * Resolves the official headshot photo URL for a rider.
   */
  getRiderPhotoUrl(riderNumber?: number | null, riderName?: string | null): string {
    if (riderNumber && this.riderMapByNumber[riderNumber]) {
      return this.riderMapByNumber[riderNumber].photoUrl;
    }

    if (riderName) {
      const cleanTarget = riderName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      for (const info of Object.values(this.riderMapByNumber)) {
        const cleanName = info.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (cleanTarget.includes(cleanName) || cleanName.includes(cleanTarget)) {
          return info.photoUrl;
        }
      }
    }

    // Default stylized fallback avatar
    return '/assets/images/rider-placeholder.svg';
  }

  /**
   * Resolves the official circuit layout image URL for a race.
   */
  getCircuitLayoutUrl(countryCode?: string | null, raceName?: string | null): string {
    const code = (countryCode || '').toLowerCase().trim();
    if (code && this.circuitMap[code]) {
      return this.circuitMap[code];
    }

    // Secondary match: guess key from race name or location keywords
    const name = (raceName || '').toLowerCase();
    if (name.includes('valencia')) return this.circuitMap['val'];
    if (name.includes('austin') || name.includes('americas') || name.includes('united states') || name.includes('usa')) return this.circuitMap['usa'];
    if (name.includes('phillip island') || name.includes('australia') || name.includes('australian')) return this.circuitMap['aus'];
    if (name.includes('buriram') || name.includes('thailand') || name.includes('thai')) return this.circuitMap['tha'];
    if (name.includes('jerez') || name.includes('spain') || name.includes('espana') || name.includes('spanish')) return this.circuitMap['spa'];
    if (name.includes('le mans') || name.includes('france') || name.includes('french')) return this.circuitMap['fra'];
    if (name.includes('mugello') || name.includes('italy') || name.includes('italia') || name.includes('italian')) return this.circuitMap['ita'];
    if (name.includes('catalunya') || name.includes('barcelona') || name.includes('catalan')) return this.circuitMap['cat'];
    if (name.includes('assen') || name.includes('dutch') || name.includes('netherlands')) return this.circuitMap['ned'];
    if (name.includes('sachsenring') || name.includes('germany') || name.includes('german')) return this.circuitMap['ger'];
    if (name.includes('silverstone') || name.includes('britain') || name.includes('british') || name.includes('united kingdom') || name.includes('gbr')) return this.circuitMap['gbr'];
    if (name.includes('spielberg') || name.includes('austria') || name.includes('austrian') || name.includes('red bull ring')) return this.circuitMap['aut'];
    if (name.includes('misano') || name.includes('san marino')) return this.circuitMap['rsm'];
    if (name.includes('motegi') || name.includes('japan') || name.includes('japanese')) return this.circuitMap['jpn'];
    if (name.includes('mandalika') || name.includes('indonesia') || name.includes('indonesian')) return this.circuitMap['ina'];
    if (name.includes('sepang') || name.includes('malaysia') || name.includes('malaysian')) return this.circuitMap['mal'];
    if (name.includes('losail') || name.includes('qatar')) return this.circuitMap['qat'];
    if (name.includes('portimao') || name.includes('portugal') || name.includes('portuguese') || name.includes('algarve')) return this.circuitMap['por'];
    if (name.includes('aragon')) return this.circuitMap['ara'];
    if (name.includes('brno') || name.includes('czech') || name.includes('czechia')) return this.circuitMap['cze'];
    if (name.includes('hungary') || name.includes('hungarian') || name.includes('balaton')) return this.circuitMap['hun'];
    if (name.includes('termas') || name.includes('argentina') || name.includes('argentine')) return this.circuitMap['arg'];
    if (name.includes('brazil') || name.includes('brazilian') || name.includes('goiania')) return this.circuitMap['bra'];

    return '';
  }

  /**
   * Graceful image error handler.
   * Immediately clears onerror to eliminate ANY possibility of recursive loops,
   * then swaps cleanly with the fallback source.
   */
  handleImageError(event: Event, fallbackSrc: string = '/assets/images/rider-placeholder.svg'): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.onerror = null;
      if (!target.src.endsWith(fallbackSrc)) {
        target.src = fallbackSrc;
      }
    }
  }

  /**
   * Safe error handler for manager / user profile avatars.
   */
  handleManagerError(event: Event): void {
    this.handleImageError(event, '/assets/images/manager-placeholder.svg');
  }

  /**
   * Safe error handler for circuit layout tracks.
   */
  handleCircuitError(event: Event): void {
    this.handleImageError(event, '/assets/images/circuit-placeholder.svg');
  }
}
