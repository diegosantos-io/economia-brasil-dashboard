package br.com.economiabr.api.service;

import br.com.economiabr.api.client.PibClient;
import br.com.economiabr.api.dto.PibResponse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

    @ExtendWith(MockitoExtension.class)
    class PibServiceTest {

        @Mock
        private PibClient pibClient;

        @InjectMocks
        private PibService pibService;

        private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void deveCombinarPibNominalECrescimentoDoMesmoPeriodo() throws Exception {

        String nominalJson = """
                [
                {
                    "resultados": [
                    {
                        "series": [
                        {
                            "serie": {
                            "202601": "3250979"
                            }
                        }
                        ]
                    }
                    ]
                }
                ]
                """;

        String crescimentoJson = """
                [
                {
                    "resultados": [
                    {
                        "series": [
                        {
                            "serie": {
                            "202601": "1.1"
                            }
                        }
                        ]
                    }
                    ]
                }
                ]
                """;

        JsonNode nominal = objectMapper.readTree(nominalJson);
        JsonNode crescimento = objectMapper.readTree(crescimentoJson);

        when(pibClient.buscarPibNominal()).thenReturn(nominal);
        when(pibClient.buscarCrescimentoPib()).thenReturn(crescimento);

        List<PibResponse> resultado = pibService.buscarHistorico();

        assertEquals(1, resultado.size());

        PibResponse pib = resultado.get(0);

        assertEquals("202601", pib.periodo());
        assertEquals("1º trimestre de 2026", pib.periodoFormatado());
        assertEquals(3250979.0, pib.valorNominal());
        assertEquals(1.1, pib.crescimento());

        verify(pibClient, times(1)).buscarPibNominal();
        verify(pibClient, times(1)).buscarCrescimentoPib();
    }

    @Test
    void deveOrdenarHistoricoDoMaisRecenteParaOMaisAntigo() throws Exception {

        String nominalJson = """
                [
                {
                    "resultados": [
                    {
                        "series": [
                        {
                            "serie": {
                            "202501": "3024723",
                            "202601": "3250979"
                            }
                        }
                        ]
                    }
                    ]
                }
                ]
                """;

        String crescimentoJson = """
                [
                {
                    "resultados": [
                    {
                        "series": [
                        {
                            "serie": {
                            "202501": "1.3",
                            "202601": "1.1"
                            }
                        }
                        ]
                    }
                    ]
                }
                ]
                """;

        when(pibClient.buscarPibNominal())
                .thenReturn(objectMapper.readTree(nominalJson));

        when(pibClient.buscarCrescimentoPib())
                .thenReturn(objectMapper.readTree(crescimentoJson));

        List<PibResponse> resultado = pibService.buscarHistorico();

        assertEquals(2, resultado.size());

        assertEquals("202601", resultado.get(0).periodo());
        assertEquals("202501", resultado.get(1).periodo());
    }

    @Test
    void deveIgnorarPeriodosSemCrescimentoCorrespondente() throws Exception {

        String nominalJson = """
                [
                {
                    "resultados": [
                    {
                        "series": [
                        {
                            "serie": {
                            "202601": "3250979",
                            "202504": "3277790"
                            }
                        }
                        ]
                    }
                    ]
                }
                ]
                """;

        String crescimentoJson = """
                [
                {
                    "resultados": [
                    {
                        "series": [
                        {
                            "serie": {
                            "202601": "1.1"
                            }
                        }
                        ]
                    }
                    ]
                }
                ]
                """;

        when(pibClient.buscarPibNominal())
                .thenReturn(objectMapper.readTree(nominalJson));

        when(pibClient.buscarCrescimentoPib())
                .thenReturn(objectMapper.readTree(crescimentoJson));

        List<PibResponse> resultado = pibService.buscarHistorico();

        assertEquals(1, resultado.size());
        assertEquals("202601", resultado.get(0).periodo());
    }
    
    @Test
    void deveLancarExcecaoQuandoIbgeNaoRetornarResultados() throws Exception {

        String jsonVazio = """
                [
                {
                    "resultados": []
                }
                ]
                """;

        when(pibClient.buscarPibNominal())
                .thenReturn(objectMapper.readTree(jsonVazio));

        when(pibClient.buscarCrescimentoPib())
                .thenReturn(objectMapper.readTree(jsonVazio));

        assertThrows(
                IllegalStateException.class,
                () -> pibService.buscarHistorico()
        );
    }
}