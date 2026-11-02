package br.com.economiabr.api.service;

import br.com.economiabr.api.client.IbgeClient;
import br.com.economiabr.api.dto.IpcaResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class IpcaServiceTest {

    private IbgeClient ibgeClient;
    private IpcaService ipcaService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        ibgeClient = mock(IbgeClient.class);
        ipcaService = new IpcaService(ibgeClient);
        objectMapper = new ObjectMapper();
    }

    @Test
    void deveRetornarHistoricoDoIpca() throws Exception {

        String json = """
                [
                  {
                    "resultados": [
                      {
                        "series": [
                          {
                            "serie": {
                              "202601": "0.33",
                              "202602": "0.70"
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
                """;

        JsonNode resposta = objectMapper.readTree(json);

        when(ibgeClient.buscarIpca(2)).thenReturn(resposta);

        List<IpcaResponse> resultado =
                ipcaService.buscarHistorico(2);

        assertEquals(2, resultado.size());

        assertEquals("202601", resultado.get(0).periodo());
        assertEquals("01/2026", resultado.get(0).periodoFormatado());
        assertEquals(0.33, resultado.get(0).valor(), 0.001);

        assertEquals("202602", resultado.get(1).periodo());
        assertEquals("02/2026", resultado.get(1).periodoFormatado());
        assertEquals(0.70, resultado.get(1).valor(), 0.001);

        verify(ibgeClient).buscarIpca(2);
    }

    @Test
    void deveIgnorarValoresSemDados() throws Exception {

        String json = """
                [
                  {
                    "resultados": [
                      {
                        "series": [
                          {
                            "serie": {
                              "202601": "0.33",
                              "202602": "..",
                              "202603": "0.45"
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
                """;

        JsonNode resposta = objectMapper.readTree(json);

        when(ibgeClient.buscarIpca(3)).thenReturn(resposta);

        List<IpcaResponse> resultado =
                ipcaService.buscarHistorico(3);

        assertEquals(2, resultado.size());
        assertEquals("202601", resultado.get(0).periodo());
        assertEquals("202603", resultado.get(1).periodo());
    }

    @Test
    void deveLancarErroQuandoNaoExistiremResultados() throws Exception {

        String json = """
                [
                  {
                    "resultados": []
                  }
                ]
                """;

        JsonNode resposta = objectMapper.readTree(json);

        when(ibgeClient.buscarIpca(12)).thenReturn(resposta);

        IllegalStateException erro = assertThrows(
                IllegalStateException.class,
                () -> ipcaService.buscarHistorico(12)
        );

        assertEquals(
                "O IBGE não retornou dados para o IPCA.",
                erro.getMessage()
        );
    }

    @Test
    void deveLancarErroQuandoNaoExistirSerie() throws Exception {

        String json = """
                [
                  {
                    "resultados": [
                      {
                        "series": []
                      }
                    ]
                  }
                ]
                """;

        JsonNode resposta = objectMapper.readTree(json);

        when(ibgeClient.buscarIpca(12)).thenReturn(resposta);

        IllegalStateException erro = assertThrows(
                IllegalStateException.class,
                () -> ipcaService.buscarHistorico(12)
        );

        assertEquals(
                "Não foi encontrada a série histórica do Brasil.",
                erro.getMessage()
        );
    }
}